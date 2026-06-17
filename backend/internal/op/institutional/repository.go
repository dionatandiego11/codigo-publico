package institutional

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"time"

	"codigo-publico/backend/internal/audit"
	"codigo-publico/backend/internal/op"
	"codigo-publico/backend/internal/web"

	"github.com/jackc/pgx/v5"
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

func (r *Repository) actorByID(ctx context.Context, citizenID string) (actor, error) {
	var a actor
	err := r.db.QueryRow(ctx, `
		SELECT id::text, full_name, role
		FROM citizens
		WHERE id = $1::uuid
	`, citizenID).Scan(&a.ID, &a.Name, &a.Role)
	return a, err
}

// isGeneralMaintainer indica Maintainer Geral efetivo — junto dos papéis
// institucionais, compõe a instância que exerce o filtro do Legislativo.
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

func (r *Repository) proposalForReview(ctx context.Context, identifier string) (proposalReview, error) {
	var p proposalReview
	err := r.db.QueryRow(ctx, `
		SELECT id::text, public_id, cycle_id::text, territory_id::text, title, status
		FROM budget_proposals
		WHERE id::text = $1 OR public_id = $1
	`, identifier).Scan(&p.ID, &p.PublicID, &p.CycleID, &p.TerritoryID, &p.Title, &p.Status)
	return p, err
}

// applyInstitutionalDecision aplica o desfecho já classificado pela política:
// admitida → matriz; filtrada → retorno; veto político → arquiva e registra
// incidente público. Tudo numa transação, com auditoria encadeada.
func (r *Repository) applyInstitutionalDecision(ctx context.Context, decider actor, p proposalReview, res op.InstitutionalResult, ground, reason string) (DecisionResult, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return DecisionResult{}, err
	}
	defer rollback(ctx, tx)

	// Lock + recheck: a proposta precisa continuar priorizada.
	var current string
	if err := tx.QueryRow(ctx, `SELECT status FROM budget_proposals WHERE id = $1::uuid FOR UPDATE`, p.ID).Scan(&current); err != nil {
		return DecisionResult{}, err
	}
	if current != statusPrioritized {
		return DecisionResult{}, web.NewError(http.StatusConflict, "a proposta não está priorizada para decisão institucional")
	}

	newStatus := proposalStatusFor(res.Outcome)
	if _, err := tx.Exec(ctx, `UPDATE budget_proposals SET status = $1 WHERE id = $2::uuid`, newStatus, p.ID); err != nil {
		return DecisionResult{}, err
	}

	auditActor := audit.Actor{ID: decider.ID, Name: decider.Name, Role: decider.Role, Type: op.AuditActorType(decider.Role)}
	if err := audit.Insert(ctx, tx, auditActor, audit.Event{
		Action:         "op.proposal.institutional_decided",
		EntityType:     "budget_proposal",
		EntityID:       p.ID,
		EntityPublicID: p.PublicID,
		Metadata:       map[string]any{"outcome": string(res.Outcome), "ground": ground, "reason": reason, "toStatus": newStatus},
	}); err != nil {
		return DecisionResult{}, err
	}

	result := DecisionResult{
		ProposalID:     p.PublicID,
		ProposalStatus: newStatus,
		Outcome:        string(res.Outcome),
		Message:        res.Message,
	}

	// Veto político: registra o incidente público de divergência.
	if res.Incident {
		incidentPublicID, err := nextIncidentPublicID(ctx, tx)
		if err != nil {
			return DecisionResult{}, err
		}
		var incidentID string
		var incidentPublicIDStored string
		err = tx.QueryRow(ctx, `
			INSERT INTO op_divergence_incidents
				(public_id, proposal_id, cycle_id, territory_id, proposal_title, reason, decided_by, decided_by_name, decided_by_role)
			VALUES ($1, $2::uuid, $3::uuid, $4::uuid, $5, $6, $7::uuid, $8, $9)
			RETURNING id::text, public_id
		`, incidentPublicID, p.ID, p.CycleID, p.TerritoryID, p.Title, reason, decider.ID, decider.Name, decider.Role).Scan(&incidentID, &incidentPublicIDStored)
		if err != nil {
			return DecisionResult{}, err
		}

		if err := audit.Insert(ctx, tx, auditActor, audit.Event{
			Action:         "op.divergence.recorded",
			EntityType:     "op_divergence_incident",
			EntityID:       incidentID,
			EntityPublicID: incidentPublicIDStored,
			Metadata:       map[string]any{"proposalId": p.PublicID, "reason": reason},
		}); err != nil {
			return DecisionResult{}, err
		}
		result.IncidentID = &incidentPublicIDStored
	}

	if err := tx.Commit(ctx); err != nil {
		return DecisionResult{}, err
	}

	return result, nil
}

func (r *Repository) listIncidents(ctx context.Context) ([]Incident, error) {
	rows, err := r.db.Query(ctx, `
		SELECT i.public_id, p.public_id, i.proposal_title, t.name, i.reason, i.decided_by_name, i.decided_by_role, i.created_at
		FROM op_divergence_incidents i
		JOIN budget_proposals p ON p.id = i.proposal_id
		JOIN territories t ON t.id = i.territory_id
		ORDER BY i.created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := make([]Incident, 0)
	for rows.Next() {
		inc, err := scanIncident(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, inc)
	}
	return list, rows.Err()
}

func scanIncident(row rowScanner) (Incident, error) {
	var inc Incident
	var createdAt time.Time
	err := row.Scan(&inc.ID, &inc.ProposalID, &inc.ProposalTitle, &inc.TerritoryName, &inc.Reason, &inc.DecidedByName, &inc.DecidedByRole, &createdAt)
	if err != nil {
		return Incident{}, err
	}
	inc.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	return inc, nil
}

func proposalStatusFor(outcome op.InstitutionalOutcome) string {
	switch outcome {
	case op.OutcomeAdmitted:
		return statusInMatrix
	case op.OutcomeFiltered:
		return statusReturned
	default: // veto político
		return statusArchived
	}
}

func nextIncidentPublicID(ctx context.Context, tx pgx.Tx) (string, error) {
	if _, err := tx.Exec(ctx, "SELECT pg_advisory_xact_lock($1)", int64(2026061804)); err != nil {
		return "", err
	}
	var next int
	if err := tx.QueryRow(ctx, `
		SELECT COALESCE(MAX(substring(public_id from 5)::int), 0) + 1
		FROM op_divergence_incidents
		WHERE public_id ~ '^DIV-[0-9]+$'
	`).Scan(&next); err != nil {
		return "", err
	}
	return fmt.Sprintf("DIV-%03d", next), nil
}

func rollback(ctx context.Context, tx pgx.Tx) {
	_ = tx.Rollback(ctx)
}

func isNoRows(err error) bool { return errors.Is(err, pgx.ErrNoRows) }
