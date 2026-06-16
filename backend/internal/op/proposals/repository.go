package proposals

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
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

const proposalSelectSQL = `
	SELECT
		p.id::text,
		p.public_id,
		p.cycle_id::text,
		d.public_id,
		t.slug,
		t.name,
		p.title,
		p.problem_summary,
		p.solution_scope,
		p.estimated_cost_cents,
		p.category,
		p.author_name,
		p.status,
		p.created_at,
		p.updated_at
	FROM budget_proposals p
	JOIN budget_demands d ON d.id = p.demand_id
	JOIN territories t ON t.id = p.territory_id
`

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

func (r *Repository) demandRecord(ctx context.Context, identifier string) (demandRecord, error) {
	var rec demandRecord
	err := r.db.QueryRow(ctx, `
		SELECT
			id::text,
			public_id,
			cycle_id::text,
			territory_id::text,
			title,
			description,
			location,
			category,
			status
		FROM budget_demands
		WHERE id::text = $1 OR public_id = $1
	`, identifier).Scan(
		&rec.ID,
		&rec.PublicID,
		&rec.CycleID,
		&rec.TerritoryID,
		&rec.Title,
		&rec.Description,
		&rec.Location,
		&rec.Category,
		&rec.Status,
	)

	return rec, err
}

func (r *Repository) hasProposalAuthority(ctx context.Context, a actor, territoryID string) (bool, error) {
	var exists bool
	err := r.db.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1
			FROM territory_maintainers
			WHERE citizen_id = $1::uuid
				AND status IN ('Provisório', 'Ativo', 'Em revisão')
				AND (term_end IS NULL OR term_end > NOW())
				AND (
					scope = 'geral'
					OR (scope = 'territorial' AND territory_id = $2::uuid)
				)
		)
	`, a.ID, territoryID).Scan(&exists)

	return exists, err
}

func (r *Repository) listProposals(ctx context.Context) ([]Proposal, error) {
	rows, err := r.db.Query(ctx, proposalSelectSQL+` ORDER BY p.created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return scanProposalRows(rows)
}

func (r *Repository) listProposalsByTerritory(ctx context.Context, territoryID string) ([]Proposal, error) {
	rows, err := r.db.Query(ctx, proposalSelectSQL+`
		WHERE p.territory_id = (
			SELECT id FROM territories WHERE id::text = $1 OR slug = $1 OR name = $1
		)
		ORDER BY p.created_at DESC
	`, territoryID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return scanProposalRows(rows)
}

func (r *Repository) getProposal(ctx context.Context, identifier string) (Proposal, error) {
	return scanProposal(r.db.QueryRow(ctx, proposalSelectSQL+`
		WHERE p.id::text = $1 OR p.public_id = $1
	`, identifier))
}

func (r *Repository) createProposal(ctx context.Context, a actor, demand demandRecord, input createProposalInput) (Proposal, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return Proposal{}, err
	}
	defer rollback(ctx, tx)

	publicID, err := nextProposalPublicID(ctx, tx)
	if err != nil {
		return Proposal{}, err
	}

	var proposalID string
	err = tx.QueryRow(ctx, `
		INSERT INTO budget_proposals (
			public_id,
			cycle_id,
			demand_id,
			territory_id,
			title,
			problem_summary,
			solution_scope,
			estimated_cost_cents,
			category,
			author_citizen_id,
			author_name,
			status
		)
		VALUES ($1, $2::uuid, $3::uuid, $4::uuid, $5, $6, $7, $8, $9, $10::uuid, $11, 'Apta para votação')
		RETURNING id::text
	`, publicID, demand.CycleID, demand.ID, demand.TerritoryID, input.Title, input.ProblemSummary, input.SolutionScope, input.EstimatedCostCents, input.Category, a.ID, a.Name).Scan(&proposalID)
	if err != nil {
		if isUniqueViolation(err) {
			return Proposal{}, web.NewError(409, "esta demanda já possui uma proposta")
		}
		return Proposal{}, err
	}

	if err := audit.Insert(ctx, tx, audit.Actor{
		ID:   a.ID,
		Name: a.Name,
		Role: a.Role,
		Type: auditActorType(a.Role),
	}, audit.Event{
		Action:         "op.proposal.created",
		EntityType:     "budget_proposal",
		EntityID:       proposalID,
		EntityPublicID: publicID,
		Metadata: map[string]any{
			"demandId":           demand.PublicID,
			"estimatedCostCents": input.EstimatedCostCents,
			"actorRole":          a.Role,
		},
	}); err != nil {
		return Proposal{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return Proposal{}, err
	}

	return r.getProposal(ctx, publicID)
}

func scanProposalRows(rows pgx.Rows) ([]Proposal, error) {
	proposals := make([]Proposal, 0)
	for rows.Next() {
		proposal, err := scanProposal(rows)
		if err != nil {
			return nil, err
		}
		proposals = append(proposals, proposal)
	}

	return proposals, rows.Err()
}

func scanProposal(row rowScanner) (Proposal, error) {
	var proposal Proposal
	var internalID string
	var createdAt time.Time
	var updatedAt time.Time

	err := row.Scan(
		&internalID,
		&proposal.ID,
		&proposal.CycleID,
		&proposal.DemandID,
		&proposal.TerritoryID,
		&proposal.TerritoryName,
		&proposal.Title,
		&proposal.ProblemSummary,
		&proposal.SolutionScope,
		&proposal.EstimatedCostCents,
		&proposal.Category,
		&proposal.AuthorName,
		&proposal.Status,
		&createdAt,
		&updatedAt,
	)
	if err != nil {
		return Proposal{}, err
	}

	proposal.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	proposal.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)

	return proposal, nil
}

func nextProposalPublicID(ctx context.Context, tx pgx.Tx) (string, error) {
	if _, err := tx.Exec(ctx, "SELECT pg_advisory_xact_lock($1)", int64(2026061602)); err != nil {
		return "", err
	}

	var nextNumber int
	if err := tx.QueryRow(ctx, `
		SELECT COALESCE(MAX(substring(public_id from 3)::int), 0) + 1
		FROM budget_proposals
		WHERE public_id ~ '^P-[0-9]+$'
	`).Scan(&nextNumber); err != nil {
		return "", err
	}

	return fmt.Sprintf("P-%03d", nextNumber), nil
}

func rollback(ctx context.Context, tx pgx.Tx) {
	_ = tx.Rollback(ctx)
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}

func auditActorType(role string) string {
	switch role {
	case "sysadmin", "admin", "institutional_admin", "legislative_admin", "vereador", "mesa_diretora":
		return "institutional"
	default:
		return "citizen"
	}
}
