package ranking

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"codigo-publico/backend/internal/audit"
	"codigo-publico/backend/internal/op"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository gerencia a persistência de itens de ranking do OP.
type Repository struct {
	db *pgxpool.Pool
}

// NewRepository cria um repositório de ranking.
func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) actorByID(ctx context.Context, citizenID string) (actor, error) {
	var a actor
	var territoryID sql.NullString
	err := r.db.QueryRow(ctx, `
		SELECT id::text, full_name, role, territory_id::text
		FROM citizens
		WHERE id = $1::uuid
	`, citizenID).Scan(&a.ID, &a.Name, &a.Role, &territoryID)
	if err != nil {
		return actor{}, err
	}
	if territoryID.Valid {
		a.TerritoryID = territoryID.String
	}
	return a, nil
}

func (r *Repository) isGeneralMaintainer(ctx context.Context, citizenID string) (bool, error) {
	var exists bool
	err := r.db.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1
			FROM territory_maintainers
			WHERE citizen_id = $1::uuid
				AND scope = 'geral'
				AND status IN ('Provisório', 'Ativo', 'Em revisão')
				AND (term_end IS NULL OR term_end > NOW())
		)
	`, citizenID).Scan(&exists)
	return exists, err
}

const rankingItemSelectSQL = `
	SELECT
		ri.public_id,
		ri.cycle_id::text,
		t.slug,
		ri.territory_name,
		d.public_id,
		p.public_id,
		ri.proposal_title,
		v.public_id,
		ri.position,
		ri.votes_yes,
		ri.votes_no,
		ri.votes_abstain,
		ri.total_votes,
		ri.approval_pct,
		ri.quorum_reached,
		ri.approved,
		ri.status,
		ri.frustration_reason,
		ri.created_at,
		ri.updated_at
	FROM op_ranking_items ri
	JOIN territories t ON t.id = ri.territory_id
	JOIN budget_proposals p ON p.id = ri.proposal_id
	JOIN budget_demands d ON d.id = p.demand_id
	JOIN op_votings v ON v.id = ri.voting_id
`

type rowScanner interface {
	Scan(dest ...any) error
}

func scanRankingItem(row rowScanner) (RankingItem, error) {
	var item RankingItem
	var frustrationReason sql.NullString
	var createdAt, updatedAt time.Time

	err := row.Scan(
		&item.ID,
		&item.CycleID,
		&item.TerritoryID,
		&item.TerritoryName,
		&item.DemandID,
		&item.ProposalID,
		&item.ProposalTitle,
		&item.VotingID,
		&item.Position,
		&item.VotesYes,
		&item.VotesNo,
		&item.VotesAbstain,
		&item.TotalVotes,
		&item.ApprovalPct,
		&item.QuorumReached,
		&item.Approved,
		&item.Status,
		&frustrationReason,
		&createdAt,
		&updatedAt,
	)
	if err != nil {
		return RankingItem{}, err
	}

	if frustrationReason.Valid {
		item.FrustrationReason = &frustrationReason.String
	}
	item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)

	return item, nil
}

func scanRankingItems(rows pgx.Rows) ([]RankingItem, error) {
	items := make([]RankingItem, 0)
	for rows.Next() {
		item, err := scanRankingItem(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

// listByCycle retorna todos os itens de ranking de um ciclo, ordenados por
// território e posição.
func (r *Repository) listByCycle(ctx context.Context, cycleID string) ([]RankingItem, error) {
	rows, err := r.db.Query(ctx, rankingItemSelectSQL+`
		WHERE ri.cycle_id = $1::uuid
		ORDER BY ri.territory_name, ri.position
	`, cycleID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanRankingItems(rows)
}

// listByTerritory retorna itens de ranking de um ciclo filtrados por território.
func (r *Repository) listByTerritory(ctx context.Context, cycleID, territoryID string) ([]RankingItem, error) {
	rows, err := r.db.Query(ctx, rankingItemSelectSQL+`
		WHERE ri.cycle_id = $1::uuid
			AND ri.territory_id = (
				SELECT id FROM territories
				WHERE id::text = $2 OR slug = $2 OR name = $2
			)
		ORDER BY ri.position
	`, cycleID, territoryID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanRankingItems(rows)
}

// getByID retorna um item de ranking por ID (interno ou público).
func (r *Repository) getByID(ctx context.Context, identifier string) (RankingItem, error) {
	return scanRankingItem(r.db.QueryRow(ctx, rankingItemSelectSQL+`
		WHERE ri.id::text = $1 OR ri.public_id = $1
	`, identifier))
}

// nextPublicID gera o próximo public_id sequencial para ranking items.
func nextPublicID(ctx context.Context, tx pgx.Tx) (string, error) {
	if _, err := tx.Exec(ctx, "SELECT pg_advisory_xact_lock($1)", int64(2026063001)); err != nil {
		return "", err
	}

	var nextNumber int
	if err := tx.QueryRow(ctx, `
		SELECT COALESCE(MAX(substring(public_id from 5)::int), 0) + 1
		FROM op_ranking_items
		WHERE public_id ~ '^RNK-[0-9]+$'
	`).Scan(&nextNumber); err != nil {
		return "", err
	}

	return fmt.Sprintf("RNK-%03d", nextNumber), nil
}

// upsertFromVoting cria ou atualiza um item de ranking a partir de uma votação
// encerrada. Recalcula posições de todos os itens do mesmo território/ciclo.
func (r *Repository) upsertFromVoting(ctx context.Context, a actor, v resolvedVoting) (RankingItem, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return RankingItem{}, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	totalVotes := v.VotesYes + v.VotesNo + v.VotesAbstain
	approvalPct := float64(0)
	if (v.VotesYes + v.VotesNo) > 0 {
		approvalPct = float64(v.VotesYes) / float64(v.VotesYes+v.VotesNo) * 100
	}
	quorumMet := v.QuorumReached >= v.QuorumNeeded
	approved := quorumMet && v.VotesYes > v.VotesNo

	publicID, err := nextPublicID(ctx, tx)
	if err != nil {
		return RankingItem{}, err
	}

	// Inserir com posição temporária (será recalculada logo abaixo).
	var itemID string
	err = tx.QueryRow(ctx, `
		INSERT INTO op_ranking_items (
			public_id, cycle_id, territory_id, proposal_id, voting_id,
			proposal_title, territory_name,
			position, votes_yes, votes_no, votes_abstain,
			total_votes, approval_pct, quorum_reached, approved
		)
		VALUES ($1, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $6, $7,
			9999, $8, $9, $10, $11, $12, $13, $14)
		ON CONFLICT (voting_id) DO UPDATE SET
			votes_yes = EXCLUDED.votes_yes,
			votes_no = EXCLUDED.votes_no,
			votes_abstain = EXCLUDED.votes_abstain,
			total_votes = EXCLUDED.total_votes,
			approval_pct = EXCLUDED.approval_pct,
			quorum_reached = EXCLUDED.quorum_reached,
			approved = EXCLUDED.approved
		RETURNING id::text
	`, publicID, v.CycleID, v.TerritoryID, v.ProposalID, v.VotingID,
		v.ProposalTitle, v.TerritoryName,
		v.VotesYes, v.VotesNo, v.VotesAbstain,
		totalVotes, approvalPct, quorumMet, approved,
	).Scan(&itemID)
	if err != nil {
		return RankingItem{}, err
	}

	// Recalcular posições de todos os itens deste território/ciclo.
	if _, err := tx.Exec(ctx, `
		WITH ranked AS (
			SELECT id,
				ROW_NUMBER() OVER (
					ORDER BY approval_pct DESC, total_votes DESC, created_at ASC
				) AS new_position
			FROM op_ranking_items
			WHERE cycle_id = $1::uuid AND territory_id = $2::uuid
		)
		UPDATE op_ranking_items ri
		SET position = ranked.new_position
		FROM ranked
		WHERE ri.id = ranked.id
	`, v.CycleID, v.TerritoryID); err != nil {
		return RankingItem{}, err
	}

	if err := audit.Insert(ctx, tx, audit.Actor{
		ID: a.ID, Name: a.Name, Role: a.Role, Type: op.AuditActorType(a.Role),
	}, audit.Event{
		Action:         "op.ranking.computed",
		EntityType:     "op_ranking_item",
		EntityID:       itemID,
		EntityPublicID: publicID,
		Metadata: map[string]any{
			"votingId":    v.VotingPublicID,
			"approved":    approved,
			"approvalPct": approvalPct,
			"totalVotes":  totalVotes,
		},
	}); err != nil {
		return RankingItem{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return RankingItem{}, err
	}

	return r.getByID(ctx, itemID)
}

// updateStatus muda o status de execução de um item de ranking. A mudança é
// auditada e, se o status for "Frustrado", exige justificativa.
func (r *Repository) updateStatus(ctx context.Context, a actor, itemID, status, reason string) (RankingItem, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return RankingItem{}, err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var currentID, currentPublicID, demandID string
	if err := tx.QueryRow(ctx, `
		SELECT ri.id::text, ri.public_id, p.demand_id::text
		FROM op_ranking_items ri
		JOIN budget_proposals p ON p.id = ri.proposal_id
		WHERE ri.id::text = $1 OR ri.public_id = $1
	`, itemID).Scan(&currentID, &currentPublicID, &demandID); err != nil {
		return RankingItem{}, err
	}

	var frustrationSQL string
	if status == "Frustrado" {
		frustrationSQL = ", frustration_reason = $3"
	} else {
		frustrationSQL = ""
		reason = ""
	}

	demandStatus := map[string]string{
		"Computado":          "Aprovada",
		"Incluído na matriz": "Em planejamento",
		"Em execução":        "Em execução",
		"Concluído":          "Concluída",
		"Frustrado":          "Frustrada",
	}[status]
	if _, err := tx.Exec(ctx, `
		UPDATE budget_demands
		SET status = $1, updated_at = NOW()
		WHERE id = $2::uuid
	`, demandStatus, demandID); err != nil {
		return RankingItem{}, err
	}

	query := fmt.Sprintf(`
		UPDATE op_ranking_items
		SET status = $1 %s
		WHERE id::text = $2 OR public_id = $2
	`, frustrationSQL)

	if status == "Frustrado" {
		if _, err := tx.Exec(ctx, query, status, itemID, reason); err != nil {
			return RankingItem{}, err
		}
	} else {
		if _, err := tx.Exec(ctx, `
			UPDATE op_ranking_items SET status = $1 WHERE id::text = $2 OR public_id = $2
		`, status, itemID); err != nil {
			return RankingItem{}, err
		}
	}

	if err := audit.Insert(ctx, tx, audit.Actor{
		ID: a.ID, Name: a.Name, Role: a.Role, Type: op.AuditActorType(a.Role),
	}, audit.Event{
		Action:         "op.ranking.status_changed",
		EntityType:     "op_ranking_item",
		EntityID:       currentID,
		EntityPublicID: currentPublicID,
		Metadata: map[string]any{
			"newStatus": status,
			"reason":    reason,
		},
	}); err != nil {
		return RankingItem{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return RankingItem{}, err
	}

	return r.getByID(ctx, itemID)
}
