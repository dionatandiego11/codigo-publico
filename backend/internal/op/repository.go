package op

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"codigo-publico/backend/internal/audit"
	"codigo-publico/backend/internal/web"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

type rowScanner interface {
	Scan(dest ...any) error
}

const cycleSelectSQL = `
	SELECT id::text, label, phase, regimento, envelope_total, starts_at, loa_deadline, created_at, updated_at
	FROM op_cycles
`

func scanCycle(row rowScanner) (Cycle, error) {
	var c Cycle
	var regimentoBytes []byte
	var startsAt sql.NullTime
	var loaDeadline sql.NullTime
	var createdAt time.Time
	var updatedAt time.Time

	err := row.Scan(&c.ID, &c.Label, &c.Phase, &regimentoBytes, &c.EnvelopeTotal, &startsAt, &loaDeadline, &createdAt, &updatedAt)
	if err != nil {
		return Cycle{}, err
	}
	if err := json.Unmarshal(regimentoBytes, &c.Regimento); err != nil {
		return Cycle{}, err
	}

	c.StartsAt = nullTimePtr(startsAt)
	c.LOADeadline = nullTimePtr(loaDeadline)
	c.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	c.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)

	// O calendário é derivado, não persistido: só faz sentido com data de início.
	if startsAt.Valid {
		cal := BuildCalendar(startsAt.Time.UTC(), c.Regimento)
		c.Calendar = &cal
	}

	return c, nil
}

func (r *Repository) actorByID(ctx context.Context, citizenID string) (actor, error) {
	var result actor
	err := r.db.QueryRow(ctx, `
		SELECT id::text, full_name, role
		FROM citizens
		WHERE id = $1::uuid
	`, citizenID).Scan(&result.ID, &result.Name, &result.Role)

	return result, err
}

// isGeneralMaintainer indica se o cidadão é Maintainer Geral efetivo — a
// autoridade institucional que move o ciclo (além do sysadmin no bootstrap).
func (r *Repository) isGeneralMaintainer(ctx context.Context, citizenID string) (bool, error) {
	var exists bool
	err := r.db.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1 FROM territory_maintainers
			WHERE citizen_id = $1::uuid AND scope = 'geral'
				AND status IN ('Provisório', 'Ativo', 'Em revisão')
				AND (term_end IS NULL OR term_end > NOW())
		)
	`, citizenID).Scan(&exists)

	return exists, err
}

func (r *Repository) getCycle(ctx context.Context, cycleID string) (Cycle, error) {
	return scanCycle(r.db.QueryRow(ctx, cycleSelectSQL+` WHERE id = $1::uuid`, cycleID))
}

func (r *Repository) getCurrentCycle(ctx context.Context) (Cycle, error) {
	return scanCycle(r.db.QueryRow(ctx, cycleSelectSQL+`
		WHERE phase NOT IN ('Encerrado','Cancelado')
		ORDER BY created_at DESC
		LIMIT 1
	`))
}

func (r *Repository) listCycles(ctx context.Context) ([]Cycle, error) {
	rows, err := r.db.Query(ctx, cycleSelectSQL+` ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := make([]Cycle, 0)
	for rows.Next() {
		c, err := scanCycle(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, c)
	}

	return list, rows.Err()
}

func (r *Repository) createCycle(ctx context.Context, creator actor, label string, reg RegimentoLocal, envelope int64, startsAt, loaDeadline *time.Time) (Cycle, error) {
	regJSON, err := json.Marshal(reg)
	if err != nil {
		return Cycle{}, err
	}

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return Cycle{}, err
	}
	defer rollback(ctx, tx)

	var id string
	err = tx.QueryRow(ctx, `
		INSERT INTO op_cycles (label, phase, regimento, envelope_total, starts_at, loa_deadline, created_by)
		VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7::uuid)
		RETURNING id::text
	`, label, CyclePhaseDraft, string(regJSON), envelope, startsAt, loaDeadline, creator.ID).Scan(&id)
	if err != nil {
		if isUniqueViolation(err) {
			return Cycle{}, web.NewError(http.StatusConflict, "já existe um ciclo de OP ativo; encerre ou cancele antes de abrir outro")
		}
		return Cycle{}, err
	}

	if _, err := r.replaceTerritoryEnvelopes(ctx, tx, id, reg, envelope); err != nil {
		return Cycle{}, err
	}

	if err := audit.Insert(ctx, tx, institutionalAuditActor(creator), audit.Event{
		Action:         "op_cycle.created",
		EntityType:     "op_cycle",
		EntityID:       id,
		EntityPublicID: id,
		Metadata:       map[string]any{"label": label, "phase": CyclePhaseDraft},
	}); err != nil {
		return Cycle{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return Cycle{}, err
	}

	return r.getCycle(ctx, id)
}

// configureCycle reescreve a configuração do ciclo — só permitido em Rascunho. O
// lock + recheck de fase é defesa em profundidade: o serviço já chamou
// CanConfigure, mas a corrida com um avanço concorrente é barrada aqui.
func (r *Repository) configureCycle(ctx context.Context, editor actor, cycleID, label string, reg RegimentoLocal, envelope int64, startsAt, loaDeadline *time.Time) (Cycle, error) {
	regJSON, err := json.Marshal(reg)
	if err != nil {
		return Cycle{}, err
	}

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return Cycle{}, err
	}
	defer rollback(ctx, tx)

	var phase string
	if err := tx.QueryRow(ctx, `SELECT phase FROM op_cycles WHERE id = $1::uuid FOR UPDATE`, cycleID).Scan(&phase); err != nil {
		return Cycle{}, err
	}
	if err := CanConfigure(phase); err != nil {
		return Cycle{}, err
	}

	if _, err := tx.Exec(ctx, `
		UPDATE op_cycles
		SET label = $1, regimento = $2::jsonb, envelope_total = $3, starts_at = $4, loa_deadline = $5, updated_at = NOW()
		WHERE id = $6::uuid
	`, label, string(regJSON), envelope, startsAt, loaDeadline, cycleID); err != nil {
		return Cycle{}, err
	}

	if _, err := r.replaceTerritoryEnvelopes(ctx, tx, cycleID, reg, envelope); err != nil {
		return Cycle{}, err
	}

	if err := audit.Insert(ctx, tx, institutionalAuditActor(editor), audit.Event{
		Action:         "op_cycle.configured",
		EntityType:     "op_cycle",
		EntityID:       cycleID,
		EntityPublicID: cycleID,
		Metadata:       map[string]any{"label": label, "envelopeTotal": envelope},
	}); err != nil {
		return Cycle{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return Cycle{}, err
	}

	return r.getCycle(ctx, cycleID)
}

func (r *Repository) listTerritoryEnvelopes(ctx context.Context, cycleID string) ([]CycleTerritoryEnvelope, error) {
	rows, err := r.db.Query(ctx, `
		SELECT
			e.territory_id::text,
			t.name,
			e.carencia_weight,
			e.equal_cents,
			e.carencia_cents,
			e.total_cents,
			e.updated_at
		FROM op_territory_envelopes e
		JOIN territories t ON t.id = e.territory_id
		WHERE e.cycle_id = $1::uuid
		ORDER BY t.name
	`, cycleID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := make([]CycleTerritoryEnvelope, 0)
	for rows.Next() {
		var item CycleTerritoryEnvelope
		var updatedAt time.Time
		if err := rows.Scan(
			&item.TerritoryID,
			&item.TerritoryName,
			&item.CarenciaWeight,
			&item.Equal,
			&item.Carencia,
			&item.Total,
			&updatedAt,
		); err != nil {
			return nil, err
		}
		item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)
		list = append(list, item)
	}

	return list, rows.Err()
}

func (r *Repository) replaceTerritoryEnvelopes(ctx context.Context, tx pgx.Tx, cycleID string, reg RegimentoLocal, envelope int64) (EnvelopeSplit, error) {
	if _, err := tx.Exec(ctx, `DELETE FROM op_territory_envelopes WHERE cycle_id = $1::uuid`, cycleID); err != nil {
		return EnvelopeSplit{}, err
	}

	if envelope <= 0 {
		return EnvelopeSplit{Total: envelope}, nil
	}

	territories, err := territoryWeights(ctx, tx)
	if err != nil {
		return EnvelopeSplit{}, err
	}

	split, err := SplitEnvelope(envelope, reg, territories)
	if err != nil {
		return EnvelopeSplit{}, err
	}

	weights := make(map[string]int64, len(territories))
	for _, territory := range territories {
		weights[territory.TerritoryID] = territory.CarenciaWeight
	}

	for _, territory := range split.Territories {
		if _, err := tx.Exec(ctx, `
			INSERT INTO op_territory_envelopes (
				cycle_id,
				territory_id,
				carencia_weight,
				equal_cents,
				carencia_cents,
				total_cents
			)
			VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6)
		`, cycleID, territory.TerritoryID, weights[territory.TerritoryID], territory.Equal, territory.Carencia, territory.Total); err != nil {
			return EnvelopeSplit{}, err
		}
	}

	return split, nil
}

func territoryWeights(ctx context.Context, tx pgx.Tx) ([]TerritoryWeight, error) {
	rows, err := tx.Query(ctx, `
		SELECT id::text, 0::bigint AS carencia_weight
		FROM territories
		ORDER BY name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := make([]TerritoryWeight, 0)
	for rows.Next() {
		var item TerritoryWeight
		if err := rows.Scan(&item.TerritoryID, &item.CarenciaWeight); err != nil {
			return nil, err
		}
		list = append(list, item)
	}

	return list, rows.Err()
}

// transitionPhase aplica uma mudança de fase já validada pela política, com lock
// de linha (recheck da fase esperada) e auditoria encadeada.
// Retorna também os dados de resolução de votações (quando aplicável) para que o
// service possa computar o ranking após o commit.
func (r *Repository) transitionPhase(ctx context.Context, mover actor, cycleID, expectedPhase, newPhase, action, reason string) (Cycle, []VotingResolutionData, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return Cycle{}, nil, err
	}
	defer rollback(ctx, tx)

	var current string
	if err := tx.QueryRow(ctx, `SELECT phase FROM op_cycles WHERE id = $1::uuid FOR UPDATE`, cycleID).Scan(&current); err != nil {
		return Cycle{}, nil, err
	}
	if current != expectedPhase {
		return Cycle{}, nil, web.NewError(http.StatusConflict, "o ciclo não está na fase esperada para esta transição")
	}

	if _, err := tx.Exec(ctx, `UPDATE op_cycles SET phase = $1, updated_at = NOW() WHERE id = $2::uuid`, newPhase, cycleID); err != nil {
		return Cycle{}, nil, err
	}

	var resolutionData []VotingResolutionData

	if newPhase == "Consolidação" {
		rows, err := tx.Query(ctx, `
			SELECT
				v.id::text,
				v.public_id,
				v.proposal_id::text,
				v.territory_id::text,
				t.name,
				p.title,
				v.quorum_needed,
				v.quorum_reached,
				v.votes_yes,
				v.votes_no,
				v.votes_abstain
			FROM op_votings v
			JOIN territories t ON t.id = v.territory_id
			JOIN budget_proposals p ON p.id = v.proposal_id
			WHERE v.cycle_id = $1::uuid
		`, cycleID)
		if err != nil {
			return Cycle{}, nil, err
		}

		type localResolution struct {
			data       VotingResolutionData
			proposalID string
			approved   bool
		}
		var resolutions []localResolution

		for rows.Next() {
			var lr localResolution
			if err := rows.Scan(
				&lr.data.VotingID, &lr.data.VotingPublicID,
				&lr.data.ProposalID, &lr.data.TerritoryID, &lr.data.TerritoryName,
				&lr.data.ProposalTitle,
				&lr.data.QuorumNeeded, &lr.data.QuorumReached,
				&lr.data.VotesYes, &lr.data.VotesNo, &lr.data.VotesAbstain,
			); err != nil {
				rows.Close()
				return Cycle{}, nil, err
			}
			lr.data.CycleID = cycleID
			lr.proposalID = lr.data.ProposalID
			lr.approved = lr.data.QuorumReached >= lr.data.QuorumNeeded && lr.data.VotesYes > lr.data.VotesNo
			resolutions = append(resolutions, lr)
		}
		rows.Close()

		for _, res := range resolutions {
			if _, err := tx.Exec(ctx, `UPDATE op_votings SET status = 'Encerrada', updated_at = NOW() WHERE id = $1::uuid`, res.data.VotingID); err != nil {
				return Cycle{}, nil, err
			}

			proposalStatus := "Retornada para maturação"
			demandStatus := "Não aprovada"
			eventType := "demand_not_approved"

			if res.approved {
				proposalStatus = "Priorizada"
				demandStatus = "Aprovada"
				eventType = "demand_approved"
			}

			if _, err := tx.Exec(ctx, `UPDATE budget_proposals SET status = $1, updated_at = NOW() WHERE id = $2::uuid`, proposalStatus, res.proposalID); err != nil {
				return Cycle{}, nil, err
			}

			var demandID string
			if err := tx.QueryRow(ctx, `SELECT demand_id::text FROM budget_proposals WHERE id = $1::uuid`, res.proposalID).Scan(&demandID); err != nil {
				return Cycle{}, nil, err
			}

			if _, err := tx.Exec(ctx, `UPDATE budget_demands SET status = $1, updated_at = NOW() WHERE id = $2::uuid`, demandStatus, demandID); err != nil {
				return Cycle{}, nil, err
			}

			if _, err := tx.Exec(ctx, `
				INSERT INTO demand_events (demand_id, actor_id, actor_type, event_type, visibility, payload)
				VALUES ($1::uuid, $2::uuid, 'system', $3, 'public', '{}'::jsonb)
			`, demandID, mover.ID, eventType); err != nil {
				return Cycle{}, nil, err
			}

			resolutionData = append(resolutionData, res.data)
		}
	}

	if err := audit.Insert(ctx, tx, institutionalAuditActor(mover), audit.Event{
		Action:         action,
		EntityType:     "op_cycle",
		EntityID:       cycleID,
		EntityPublicID: cycleID,
		Metadata:       map[string]any{"fromPhase": current, "toPhase": newPhase, "reason": reason},
	}); err != nil {
		return Cycle{}, nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return Cycle{}, nil, err
	}

	cycle, err := r.getCycle(ctx, cycleID)
	return cycle, resolutionData, err
}

// ── Helpers ───────────────────────────────────────────────────────────────────

func institutionalAuditActor(a actor) audit.Actor {
	return audit.Actor{ID: a.ID, Name: a.Name, Role: a.Role, Type: "institutional"}
}

func rollback(ctx context.Context, tx pgx.Tx) {
	_ = tx.Rollback(ctx)
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		return pgErr.Code == "23505"
	}

	return false
}

func nullTimePtr(value sql.NullTime) *string {
	if !value.Valid {
		return nil
	}

	formatted := value.Time.UTC().Format(time.RFC3339)
	return &formatted
}

// snapshotCycleResult congela o resultado do ranking como JSONB.
func (r *Repository) snapshotCycleResult(ctx context.Context, cycleID string) error {
	var cycleLabel string
	if err := r.db.QueryRow(ctx, `SELECT label FROM op_cycles WHERE id = $1::uuid`, cycleID).Scan(&cycleLabel); err != nil {
		return err
	}

	rows, err := r.db.Query(ctx, `
		SELECT
			ri.position,
			ri.proposal_title,
			ri.territory_id::text,
			ri.territory_name,
			ri.votes_yes,
			ri.votes_no,
			ri.votes_abstain,
			ri.total_votes,
			ri.approval_pct,
			ri.quorum_reached,
			ri.approved,
			ri.status
		FROM op_ranking_items ri
		WHERE ri.cycle_id = $1::uuid
		ORDER BY ri.territory_name, ri.position
	`, cycleID)
	if err != nil {
		return err
	}
	defer rows.Close()

	items := make([]CycleResultItem, 0)
	for rows.Next() {
		var item CycleResultItem
		if err := rows.Scan(
			&item.Position, &item.ProposalTitle,
			&item.TerritoryID, &item.TerritoryName,
			&item.VotesYes, &item.VotesNo, &item.VotesAbstain,
			&item.TotalVotes, &item.ApprovalPct,
			&item.QuorumReached, &item.Approved, &item.Status,
		); err != nil {
			return err
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return err
	}

	snapshot := CycleResultSnapshot{
		CycleID:    cycleID,
		CycleLabel: cycleLabel,
		Frozen:     true,
		Items:      items,
	}

	snapshotJSON, err := json.Marshal(snapshot)
	if err != nil {
		return err
	}

	_, err = r.db.Exec(ctx, `
		INSERT INTO cycle_result_snapshots (cycle_id, snapshot_data)
		VALUES ($1::uuid, $2::jsonb)
		ON CONFLICT (cycle_id) DO UPDATE SET snapshot_data = EXCLUDED.snapshot_data, generated_at = NOW()
	`, cycleID, snapshotJSON)
	return err
}

// getCycleResultSnapshot retorna o snapshot congelado do resultado, ou nil se não existir.
func (r *Repository) getCycleResultSnapshot(ctx context.Context, cycleID string) (*CycleResultSnapshot, error) {
	var snapshotJSON []byte
	var generatedAt time.Time
	var id string
	err := r.db.QueryRow(ctx, `
		SELECT id::text, snapshot_data, generated_at
		FROM cycle_result_snapshots
		WHERE cycle_id = $1::uuid
	`, cycleID).Scan(&id, &snapshotJSON, &generatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	var snapshot CycleResultSnapshot
	if err := json.Unmarshal(snapshotJSON, &snapshot); err != nil {
		return nil, err
	}
	snapshot.ID = id
	snapshot.GeneratedAt = generatedAt.UTC().Format(time.RFC3339)

	return &snapshot, nil
}
