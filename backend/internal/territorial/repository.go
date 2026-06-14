package territorial

import (
	"context"
	"database/sql"
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

const bondSelectSQL = `
	SELECT
		b.id::text,
		b.citizen_id::text,
		c.full_name,
		b.territory_id::text,
		t.slug,
		t.name,
		b.bond_type,
		b.trust_level,
		b.status,
		b.evidence_note,
		b.decision_reason,
		b.decided_at,
		b.created_at
	FROM territory_bonds b
	JOIN citizens c ON c.id = b.citizen_id
	JOIN territories t ON t.id = b.territory_id
`

type rowScanner interface {
	Scan(dest ...any) error
}

func scanBond(row rowScanner) (Bond, error) {
	var bond Bond
	var evidenceNote sql.NullString
	var decisionReason sql.NullString
	var decidedAt sql.NullTime
	var createdAt time.Time

	err := row.Scan(
		&bond.ID,
		&bond.CitizenID,
		&bond.CitizenName,
		&bond.TerritoryID,
		&bond.TerritorySlug,
		&bond.TerritoryName,
		&bond.BondType,
		&bond.TrustLevel,
		&bond.Status,
		&evidenceNote,
		&decisionReason,
		&decidedAt,
		&createdAt,
	)
	if err != nil {
		return Bond{}, err
	}

	bond.EvidenceNote = nullStringPtr(evidenceNote)
	bond.DecisionReason = nullStringPtr(decisionReason)
	bond.DecidedAt = nullTimePtr(decidedAt)
	bond.CreatedAt = createdAt.UTC().Format(time.RFC3339)

	return bond, nil
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

func (r *Repository) resolveTerritory(ctx context.Context, identifier string) (string, string, error) {
	var id string
	var name string
	err := r.db.QueryRow(ctx, `
		SELECT id::text, name
		FROM territories
		WHERE id::text = $1 OR slug = $1
	`, identifier).Scan(&id, &name)

	return id, name, err
}

func (r *Repository) hasActiveTerritorialMaintainer(ctx context.Context, territoryID string) (bool, error) {
	var exists bool
	err := r.db.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1 FROM territory_maintainers
			WHERE territory_id = $1::uuid AND scope = 'territorial'
				AND status IN ('Provisório', 'Ativo', 'Em revisão')
				AND (term_end IS NULL OR term_end > NOW())
		)
	`, territoryID).Scan(&exists)

	return exists, err
}

func (r *Repository) isTerritorialMaintainer(ctx context.Context, citizenID, territoryID string) (bool, error) {
	var exists bool
	err := r.db.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1 FROM territory_maintainers
			WHERE citizen_id = $1::uuid AND territory_id = $2::uuid
				AND scope = 'territorial'
				AND status IN ('Provisório', 'Ativo', 'Em revisão')
				AND (term_end IS NULL OR term_end > NOW())
		)
	`, citizenID, territoryID).Scan(&exists)

	return exists, err
}

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

func (r *Repository) getBond(ctx context.Context, bondID string) (Bond, error) {
	row := r.db.QueryRow(ctx, bondSelectSQL+` WHERE b.id = $1::uuid`, bondID)
	return scanBond(row)
}

func (r *Repository) getActiveBondByCitizen(ctx context.Context, citizenID string) (Bond, error) {
	row := r.db.QueryRow(ctx, bondSelectSQL+`
		WHERE b.citizen_id = $1::uuid
			AND b.status IN ('Pendente', 'Aprovado', 'Contestado')
	`, citizenID)
	return scanBond(row)
}

func (r *Repository) listBondsByTerritory(ctx context.Context, territoryID, status string) ([]Bond, error) {
	query := bondSelectSQL + ` WHERE b.territory_id = $1::uuid`
	args := []any{territoryID}
	if status != "" {
		query += ` AND b.status = $2`
		args = append(args, status)
	}
	query += ` ORDER BY b.created_at DESC`

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	bonds := make([]Bond, 0)
	for rows.Next() {
		bond, err := scanBond(rows)
		if err != nil {
			return nil, err
		}
		bonds = append(bonds, bond)
	}

	return bonds, rows.Err()
}

func (r *Repository) createBond(ctx context.Context, requester actor, territoryID, bondType, evidenceNote string) (Bond, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return Bond{}, err
	}
	defer rollback(ctx, tx)

	var bondID string
	err = tx.QueryRow(ctx, `
		INSERT INTO territory_bonds (citizen_id, territory_id, bond_type, trust_level, status, evidence_note)
		VALUES ($1::uuid, $2::uuid, $3, 'T1', 'Pendente', $4)
		RETURNING id::text
	`, requester.ID, territoryID, bondType, nullIfEmpty(evidenceNote)).Scan(&bondID)
	if err != nil {
		if isUniqueViolation(err) {
			return Bond{}, web.NewError(http.StatusConflict, "citizen already has an active territorial bond")
		}
		return Bond{}, err
	}

	if err := audit.Insert(ctx, tx, citizenAuditActor(requester), audit.Event{
		Action:         "bond.requested",
		EntityType:     "territory_bond",
		EntityID:       bondID,
		EntityPublicID: bondID,
		Metadata:       map[string]any{"bondType": bondType, "territoryId": territoryID},
	}); err != nil {
		return Bond{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return Bond{}, err
	}

	return r.getBond(ctx, bondID)
}

// updateBondStatus aplica uma transição já validada pelo serviço, com lock de
// linha, atualização de campos de decisão e evento de auditoria encadeado.
func (r *Repository) updateBondStatus(
	ctx context.Context,
	decider actor,
	deciderType string,
	bondID string,
	expectedStatus string,
	newStatus string,
	trustLevel string,
	reason string,
	action string,
) (Bond, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return Bond{}, err
	}
	defer rollback(ctx, tx)

	var currentStatus string
	if err := tx.QueryRow(ctx, `
		SELECT status FROM territory_bonds WHERE id = $1::uuid FOR UPDATE
	`, bondID).Scan(&currentStatus); err != nil {
		return Bond{}, err
	}

	if currentStatus != expectedStatus {
		return Bond{}, web.NewError(http.StatusConflict, "bond is not in a state that allows this action")
	}

	if trustLevel != "" {
		_, err = tx.Exec(ctx, `
			UPDATE territory_bonds
			SET status = $1, trust_level = $2, decided_by = $3::uuid, decision_reason = $4, decided_at = NOW()
			WHERE id = $5::uuid
		`, newStatus, trustLevel, decider.ID, nullIfEmpty(reason), bondID)
	} else {
		_, err = tx.Exec(ctx, `
			UPDATE territory_bonds
			SET status = $1, decided_by = $2::uuid, decision_reason = $3, decided_at = NOW()
			WHERE id = $4::uuid
		`, newStatus, decider.ID, nullIfEmpty(reason), bondID)
	}
	if err != nil {
		return Bond{}, err
	}

	if err := audit.Insert(ctx, tx, audit.Actor{ID: decider.ID, Name: decider.Name, Role: decider.Role, Type: deciderType}, audit.Event{
		Action:         action,
		EntityType:     "territory_bond",
		EntityID:       bondID,
		EntityPublicID: bondID,
		Metadata: map[string]any{
			"fromStatus": expectedStatus,
			"toStatus":   newStatus,
			"reason":     reason,
		},
	}); err != nil {
		return Bond{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return Bond{}, err
	}

	return r.getBond(ctx, bondID)
}

// ── Recursos ──────────────────────────────────────────────────────────────────

func (r *Repository) createAppeal(ctx context.Context, requester actor, bondID, reason string) (Appeal, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return Appeal{}, err
	}
	defer rollback(ctx, tx)

	var appeal Appeal
	var createdAt time.Time
	err = tx.QueryRow(ctx, `
		INSERT INTO bond_appeals (bond_id, citizen_id, reason)
		VALUES ($1::uuid, $2::uuid, $3)
		RETURNING id::text, bond_id::text, reason, status, created_at
	`, bondID, requester.ID, reason).Scan(&appeal.ID, &appeal.BondID, &appeal.Reason, &appeal.Status, &createdAt)
	if err != nil {
		if isUniqueViolation(err) {
			return Appeal{}, web.NewError(http.StatusConflict, "bond already has a pending appeal")
		}
		return Appeal{}, err
	}
	appeal.CreatedAt = createdAt.UTC().Format(time.RFC3339)

	if err := audit.Insert(ctx, tx, citizenAuditActor(requester), audit.Event{
		Action:         "bond.appealed",
		EntityType:     "bond_appeal",
		EntityID:       appeal.ID,
		EntityPublicID: appeal.ID,
		Metadata:       map[string]any{"bondId": bondID},
	}); err != nil {
		return Appeal{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return Appeal{}, err
	}

	return appeal, nil
}

type appealRecord struct {
	ID        string
	BondID    string
	CitizenID string
	Status    string
}

func (r *Repository) getAppeal(ctx context.Context, appealID string) (appealRecord, error) {
	var record appealRecord
	err := r.db.QueryRow(ctx, `
		SELECT id::text, bond_id::text, citizen_id::text, status
		FROM bond_appeals
		WHERE id = $1::uuid
	`, appealID).Scan(&record.ID, &record.BondID, &record.CitizenID, &record.Status)

	return record, err
}

func (r *Repository) decideAppeal(ctx context.Context, decider actor, appealID, newStatus, reason string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer rollback(ctx, tx)

	commandTag, err := tx.Exec(ctx, `
		UPDATE bond_appeals
		SET status = $1, decided_by = $2::uuid, decision_reason = $3, decided_at = NOW()
		WHERE id = $4::uuid AND status = 'Pendente'
	`, newStatus, decider.ID, nullIfEmpty(reason), appealID)
	if err != nil {
		return err
	}
	if commandTag.RowsAffected() == 0 {
		return web.NewError(http.StatusConflict, "appeal is not pending")
	}

	if err := audit.Insert(ctx, tx, institutionalAuditActor(decider), audit.Event{
		Action:         "bond.appeal_decided",
		EntityType:     "bond_appeal",
		EntityID:       appealID,
		EntityPublicID: appealID,
		Metadata:       map[string]any{"outcome": newStatus, "reason": reason},
	}); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// ── Contestações ──────────────────────────────────────────────────────────────

func (r *Repository) createContestation(ctx context.Context, contestant actor, bondID, reason string, newFact bool) (Contestation, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return Contestation{}, err
	}
	defer rollback(ctx, tx)

	var contestation Contestation
	var createdAt time.Time
	err = tx.QueryRow(ctx, `
		INSERT INTO bond_contestations (bond_id, contestant_citizen_id, reason)
		VALUES ($1::uuid, $2::uuid, $3)
		RETURNING id::text, bond_id::text, reason, status, created_at
	`, bondID, contestant.ID, reason).Scan(&contestation.ID, &contestation.BondID, &contestation.Reason, &contestation.Status, &createdAt)
	if err != nil {
		if isUniqueViolation(err) {
			return Contestation{}, web.NewError(http.StatusConflict, "bond already has an open contestation")
		}
		return Contestation{}, err
	}
	contestation.CreatedAt = createdAt.UTC().Format(time.RFC3339)

	// A contestação abre revisão: o vínculo vai para Contestado, mas não é
	// suspenso nem revogado sem decisão fundamentada.
	if _, err := tx.Exec(ctx, `
		UPDATE territory_bonds SET status = 'Contestado' WHERE id = $1::uuid AND status = 'Aprovado'
	`, bondID); err != nil {
		return Contestation{}, err
	}

	// A invocação de fato novo (que ignora o período de descanso) fica
	// auditável para coibir abuso do próprio "fato novo".
	if err := audit.Insert(ctx, tx, citizenAuditActor(contestant), audit.Event{
		Action:         "bond.contested",
		EntityType:     "bond_contestation",
		EntityID:       contestation.ID,
		EntityPublicID: contestation.ID,
		Metadata:       map[string]any{"bondId": bondID, "newFact": newFact},
	}); err != nil {
		return Contestation{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return Contestation{}, err
	}

	return contestation, nil
}

// lastUpheldContestationAt devolve a data da decisão mais recente que manteve o
// vínculo ("Mantido"), base do período de descanso contra recontestação.
func (r *Repository) lastUpheldContestationAt(ctx context.Context, bondID string) (time.Time, bool, error) {
	var decidedAt sql.NullTime
	err := r.db.QueryRow(ctx, `
		SELECT decided_at
		FROM bond_contestations
		WHERE bond_id = $1::uuid AND status = 'Mantido' AND decided_at IS NOT NULL
		ORDER BY decided_at DESC
		LIMIT 1
	`, bondID).Scan(&decidedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return time.Time{}, false, nil
	}
	if err != nil {
		return time.Time{}, false, err
	}
	if !decidedAt.Valid {
		return time.Time{}, false, nil
	}

	return decidedAt.Time, true, nil
}

type contestationRecord struct {
	ID          string
	BondID      string
	Contestant  string
	Status      string
	TerritoryID string
	BondOwnerID string
}

func (r *Repository) getContestation(ctx context.Context, contestationID string) (contestationRecord, error) {
	var record contestationRecord
	err := r.db.QueryRow(ctx, `
		SELECT bc.id::text, bc.bond_id::text, bc.contestant_citizen_id::text, bc.status,
			b.territory_id::text, b.citizen_id::text
		FROM bond_contestations bc
		JOIN territory_bonds b ON b.id = bc.bond_id
		WHERE bc.id = $1::uuid
	`, contestationID).Scan(&record.ID, &record.BondID, &record.Contestant, &record.Status, &record.TerritoryID, &record.BondOwnerID)

	return record, err
}

func (r *Repository) submitDefense(ctx context.Context, owner actor, contestationID, defense string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer rollback(ctx, tx)

	commandTag, err := tx.Exec(ctx, `
		UPDATE bond_contestations
		SET defense = $1
		WHERE id = $2::uuid AND status = 'Aberta'
	`, defense, contestationID)
	if err != nil {
		return err
	}
	if commandTag.RowsAffected() == 0 {
		return web.NewError(http.StatusConflict, "contestation is not open")
	}

	if err := audit.Insert(ctx, tx, citizenAuditActor(owner), audit.Event{
		Action:         "bond.defense_submitted",
		EntityType:     "bond_contestation",
		EntityID:       contestationID,
		EntityPublicID: contestationID,
		Metadata:       map[string]any{},
	}); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (r *Repository) decideContestation(ctx context.Context, decider actor, record contestationRecord, outcome, reason string) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer rollback(ctx, tx)

	if _, err := tx.Exec(ctx, `
		UPDATE bond_contestations
		SET status = $1, decided_by = $2::uuid, decision_reason = $3, decided_at = NOW()
		WHERE id = $4::uuid
	`, outcome, decider.ID, nullIfEmpty(reason), record.ID); err != nil {
		return err
	}

	switch outcome {
	case ContestationStatusUpheld:
		if _, err := tx.Exec(ctx, `
			UPDATE territory_bonds SET status = 'Aprovado' WHERE id = $1::uuid
		`, record.BondID); err != nil {
			return err
		}
	case ContestationStatusRevoked:
		if _, err := tx.Exec(ctx, `
			UPDATE territory_bonds
			SET status = 'Revogado', decided_by = $1::uuid, decision_reason = $2, decided_at = NOW()
			WHERE id = $3::uuid
		`, decider.ID, nullIfEmpty(reason), record.BondID); err != nil {
			return err
		}
	}

	if err := audit.Insert(ctx, tx, institutionalAuditActor(decider), audit.Event{
		Action:         "bond.contestation_decided",
		EntityType:     "bond_contestation",
		EntityID:       record.ID,
		EntityPublicID: record.ID,
		Metadata:       map[string]any{"outcome": outcome, "reason": reason, "bondId": record.BondID},
	}); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// ── Governança pública ────────────────────────────────────────────────────────

func (r *Repository) governanceSummary(ctx context.Context, territoryID, territoryName string) (GovernanceSummary, error) {
	summary := GovernanceSummary{TerritoryID: territoryID, TerritoryName: territoryName}

	err := r.db.QueryRow(ctx, `
		SELECT
			COUNT(*) FILTER (WHERE m.scope = 'territorial' AND m.status IN ('Provisório', 'Ativo', 'Em revisão') AND (m.term_end IS NULL OR m.term_end > NOW())),
			(SELECT COUNT(*) FROM territory_bonds b WHERE b.territory_id = $1::uuid AND b.status = 'Aprovado'),
			(SELECT COUNT(*) FROM territory_bonds b WHERE b.territory_id = $1::uuid AND b.status = 'Pendente'),
			(SELECT COUNT(*) FROM territory_bonds b WHERE b.territory_id = $1::uuid AND b.status = 'Contestado')
		FROM territory_maintainers m
		WHERE m.territory_id = $1::uuid
	`, territoryID).Scan(
		&summary.ActiveMaintainers,
		&summary.ApprovedBondsCount,
		&summary.PendingBondsCount,
		&summary.ContestedBondsCount,
	)
	if err != nil {
		return GovernanceSummary{}, err
	}

	summary.HasActiveMaintainer = summary.ActiveMaintainers > 0
	// Território sem maintainer continua visível, mas não aceita novos vínculos.
	summary.AcceptsNewBonds = summary.HasActiveMaintainer

	return summary, nil
}

// ── Helpers ───────────────────────────────────────────────────────────────────

func citizenAuditActor(a actor) audit.Actor {
	return audit.Actor{ID: a.ID, Name: a.Name, Role: a.Role, Type: "citizen"}
}

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

func nullIfEmpty(value string) any {
	if value == "" {
		return nil
	}

	return value
}

func nullStringPtr(value sql.NullString) *string {
	if !value.Valid {
		return nil
	}

	return &value.String
}

func nullTimePtr(value sql.NullTime) *string {
	if !value.Valid {
		return nil
	}

	formatted := value.Time.UTC().Format(time.RFC3339)
	return &formatted
}
