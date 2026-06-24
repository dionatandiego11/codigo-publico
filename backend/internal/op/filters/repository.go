package filters

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"time"

	"codigo-publico/backend/internal/audit"
	"codigo-publico/backend/internal/op"
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

func (r *Repository) listFilters(ctx context.Context, input listFiltersInput) ([]BudgetFilter, error) {
	rows, err := r.db.Query(ctx, `
		SELECT
			f.public_id,
			f.cycle_id::text,
			f.territory_id::text,
			t.name,
			COALESCE(d.public_id, ''),
			COALESCE(d.title, ''),
			p.public_id,
			f.verdict,
			f.message,
			f.return_path,
			f.estimated_cost_cents,
			f.available_cents,
			f.actor_name,
			f.actor_role,
			f.status,
			f.appeal_note,
			a.public_id,
			a.status,
			a.decision_reason,
			a.decided_at,
			f.created_at,
			f.updated_at
		FROM budget_filters f
		JOIN territories t ON t.id = f.territory_id
		LEFT JOIN budget_demands d ON d.id = f.demand_id
		LEFT JOIN budget_proposals p ON p.id = f.proposal_id
		LEFT JOIN LATERAL (
			SELECT public_id, status, decision_reason, decided_at
			FROM budget_filter_appeals
			WHERE filter_id = f.id
			ORDER BY created_at DESC
			LIMIT 1
		) a ON TRUE
		WHERE ($1 = '' OR f.cycle_id::text = $1)
			AND ($2 = '' OR f.territory_id::text = $2 OR t.slug = $2 OR t.name = $2)
			AND ($3 = '' OR d.id::text = $3 OR d.public_id = $3)
		ORDER BY f.created_at DESC
	`, input.CycleID, input.TerritoryID, input.DemandID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := make([]BudgetFilter, 0)
	for rows.Next() {
		var item BudgetFilter
		var proposalID sql.NullString
		var appealNote sql.NullString
		var appealID sql.NullString
		var appealStatus sql.NullString
		var appealDecisionReason sql.NullString
		var appealDecidedAt sql.NullTime
		var createdAt time.Time
		var updatedAt time.Time

		if err := rows.Scan(
			&item.ID,
			&item.CycleID,
			&item.TerritoryID,
			&item.TerritoryName,
			&item.DemandID,
			&item.DemandTitle,
			&proposalID,
			&item.Verdict,
			&item.Message,
			&item.ReturnPath,
			&item.EstimatedCostCents,
			&item.AvailableCents,
			&item.ActorName,
			&item.ActorRole,
			&item.Status,
			&appealNote,
			&appealID,
			&appealStatus,
			&appealDecisionReason,
			&appealDecidedAt,
			&createdAt,
			&updatedAt,
		); err != nil {
			return nil, err
		}

		if proposalID.Valid {
			item.ProposalID = &proposalID.String
		}
		if appealNote.Valid {
			item.AppealNote = &appealNote.String
		}
		if appealID.Valid {
			item.AppealID = &appealID.String
		}
		if appealStatus.Valid {
			item.AppealStatus = &appealStatus.String
		}
		if appealDecisionReason.Valid {
			item.AppealDecisionReason = &appealDecisionReason.String
		}
		if appealDecidedAt.Valid {
			formatted := appealDecidedAt.Time.UTC().Format(time.RFC3339)
			item.AppealDecidedAt = &formatted
		}
		item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
		item.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)

		list = append(list, item)
	}

	return list, rows.Err()
}

func (r *Repository) filterRecord(ctx context.Context, identifier string) (filterRecord, error) {
	var record filterRecord
	err := r.db.QueryRow(ctx, `
		SELECT f.id::text, f.public_id, f.territory_id::text, t.name, f.status
		FROM budget_filters f
		JOIN territories t ON t.id = f.territory_id
		WHERE f.id::text = $1 OR f.public_id = $1
	`, identifier).Scan(&record.ID, &record.PublicID, &record.TerritoryID, &record.TerritoryName, &record.Status)
	return record, err
}

func (r *Repository) filterHasAppeal(ctx context.Context, filterID string) (bool, error) {
	var exists bool
	err := r.db.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1 FROM budget_filter_appeals
			WHERE filter_id = $1::uuid
		)
	`, filterID).Scan(&exists)
	return exists, err
}

func (r *Repository) citizenLinkedToTerritory(ctx context.Context, citizenID, territoryID string) (bool, error) {
	var linked bool
	err := r.db.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1 FROM citizens
			WHERE id = $1::uuid AND territory_id = $2::uuid
		) OR EXISTS (
			SELECT 1 FROM territory_bonds
			WHERE citizen_id = $1::uuid
				AND territory_id = $2::uuid
				AND status IN ('Aprovado', 'Contestado')
		)
	`, citizenID, territoryID).Scan(&linked)
	return linked, err
}

func (r *Repository) isGeneralMaintainer(ctx context.Context, citizenID string) (bool, error) {
	var exists bool
	err := r.db.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1 FROM territory_maintainers
			WHERE citizen_id = $1::uuid
				AND scope = 'geral'
				AND status IN ('Provisório', 'Ativo', 'Em revisão')
				AND (term_end IS NULL OR term_end > NOW())
		)
	`, citizenID).Scan(&exists)
	return exists, err
}

func (r *Repository) createAppeal(ctx context.Context, a actor, filter filterRecord, reason string) (BudgetFilterAppeal, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return BudgetFilterAppeal{}, err
	}
	defer rollback(ctx, tx)

	publicID, err := nextAppealPublicID(ctx, tx)
	if err != nil {
		return BudgetFilterAppeal{}, err
	}

	var appealID string
	err = tx.QueryRow(ctx, `
		INSERT INTO budget_filter_appeals (
			public_id,
			filter_id,
			territory_id,
			citizen_id,
			citizen_name,
			reason
		)
		VALUES ($1, $2::uuid, $3::uuid, $4::uuid, $5, $6)
		RETURNING id::text
	`, publicID, filter.ID, filter.TerritoryID, a.ID, a.Name, reason).Scan(&appealID)
	if err != nil {
		if isUniqueViolation(err) {
			return BudgetFilterAppeal{}, web.NewError(http.StatusConflict, "já existe recurso aberto para este filtro")
		}
		return BudgetFilterAppeal{}, err
	}

	if _, err := tx.Exec(ctx, `
		UPDATE budget_filters
		SET status = 'Em recurso', appeal_note = $1, updated_at = NOW()
		WHERE id = $2::uuid
	`, reason, filter.ID); err != nil {
		return BudgetFilterAppeal{}, err
	}

	if err := audit.Insert(ctx, tx, audit.Actor{
		ID:   a.ID,
		Name: a.Name,
		Role: a.Role,
		Type: op.AuditActorType(a.Role),
	}, audit.Event{
		Action:         "op.budget_filter.appealed",
		EntityType:     "budget_filter",
		EntityID:       filter.ID,
		EntityPublicID: filter.PublicID,
		Metadata: map[string]any{
			"appealId":    publicID,
			"territoryId": filter.TerritoryID,
			"reason":      reason,
		},
	}); err != nil {
		return BudgetFilterAppeal{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return BudgetFilterAppeal{}, err
	}

	return r.getAppeal(ctx, appealID)
}

func (r *Repository) getAppeal(ctx context.Context, appealID string) (BudgetFilterAppeal, error) {
	var appeal BudgetFilterAppeal
	var decisionReason sql.NullString
	var decidedAt sql.NullTime
	var createdAt time.Time
	err := r.db.QueryRow(ctx, `
		SELECT
			a.public_id,
			f.public_id,
			a.territory_id::text,
			t.name,
			a.citizen_name,
			a.reason,
			a.status,
			a.decision_reason,
			a.decided_at,
			a.created_at
		FROM budget_filter_appeals a
		JOIN budget_filters f ON f.id = a.filter_id
		JOIN territories t ON t.id = a.territory_id
		WHERE a.id = $1::uuid
	`, appealID).Scan(
		&appeal.ID,
		&appeal.FilterID,
		&appeal.TerritoryID,
		&appeal.TerritoryName,
		&appeal.CitizenName,
		&appeal.Reason,
		&appeal.Status,
		&decisionReason,
		&decidedAt,
		&createdAt,
	)
	if err != nil {
		return BudgetFilterAppeal{}, err
	}
	if decisionReason.Valid {
		appeal.DecisionReason = &decisionReason.String
	}
	if decidedAt.Valid {
		formatted := decidedAt.Time.UTC().Format(time.RFC3339)
		appeal.DecidedAt = &formatted
	}
	appeal.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	return appeal, nil
}

func (r *Repository) appealRecord(ctx context.Context, identifier string) (appealRecord, error) {
	var record appealRecord
	err := r.db.QueryRow(ctx, `
		SELECT
			a.id::text,
			a.public_id,
			f.id::text,
			f.public_id,
			COALESCE(f.demand_id::text, ''),
			a.status
		FROM budget_filter_appeals a
		JOIN budget_filters f ON f.id = a.filter_id
		WHERE a.id::text = $1 OR a.public_id = $1
	`, identifier).Scan(&record.ID, &record.PublicID, &record.FilterID, &record.FilterPublicID, &record.DemandID, &record.Status)
	return record, err
}

func (r *Repository) decideAppeal(ctx context.Context, decider actor, appeal appealRecord, approve bool, reason string) (BudgetFilterAppeal, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return BudgetFilterAppeal{}, err
	}
	defer rollback(ctx, tx)

	var current string
	if err := tx.QueryRow(ctx, `
		SELECT status FROM budget_filter_appeals WHERE id = $1::uuid FOR UPDATE
	`, appeal.ID).Scan(&current); err != nil {
		return BudgetFilterAppeal{}, err
	}
	if current != "Aberto" {
		return BudgetFilterAppeal{}, web.NewError(http.StatusConflict, "este recurso não está aberto")
	}

	appealStatus := "Indeferido"
	filterStatus := "Registrado"
	demandStatus := "Maturação territorial"
	if approve {
		appealStatus = "Deferido"
		filterStatus = "Superado"
		demandStatus = "Apta para priorização"
	}

	if _, err := tx.Exec(ctx, `
		UPDATE budget_filter_appeals
		SET status = $1, decided_by = $2::uuid, decision_reason = $3, decided_at = NOW(), updated_at = NOW()
		WHERE id = $4::uuid
	`, appealStatus, decider.ID, reason, appeal.ID); err != nil {
		return BudgetFilterAppeal{}, err
	}

	if _, err := tx.Exec(ctx, `
		UPDATE budget_filters
		SET status = $1, updated_at = NOW()
		WHERE id = $2::uuid
	`, filterStatus, appeal.FilterID); err != nil {
		return BudgetFilterAppeal{}, err
	}

	if appeal.DemandID != "" {
		if _, err := tx.Exec(ctx, `
			UPDATE budget_demands
			SET status = $1, updated_at = NOW()
			WHERE id = $2::uuid
		`, demandStatus, appeal.DemandID); err != nil {
			return BudgetFilterAppeal{}, err
		}
	}

	if err := audit.Insert(ctx, tx, audit.Actor{
		ID:   decider.ID,
		Name: decider.Name,
		Role: decider.Role,
		Type: op.AuditActorType(decider.Role),
	}, audit.Event{
		Action:         "op.budget_filter.appeal_decided",
		EntityType:     "budget_filter",
		EntityID:       appeal.FilterID,
		EntityPublicID: appeal.FilterPublicID,
		Metadata: map[string]any{
			"appealId":     appeal.PublicID,
			"appealStatus": appealStatus,
			"filterStatus": filterStatus,
			"demandStatus": demandStatus,
			"reason":       reason,
		},
	}); err != nil {
		return BudgetFilterAppeal{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return BudgetFilterAppeal{}, err
	}

	return r.getAppeal(ctx, appeal.ID)
}

func nextAppealPublicID(ctx context.Context, tx pgx.Tx) (string, error) {
	if _, err := tx.Exec(ctx, "SELECT pg_advisory_xact_lock($1)", int64(2026061702)); err != nil {
		return "", err
	}

	var nextNumber int
	if err := tx.QueryRow(ctx, `
		SELECT COALESCE(MAX(substring(public_id from 5)::int), 0) + 1
		FROM budget_filter_appeals
		WHERE public_id ~ '^BFA-[0-9]+$'
	`).Scan(&nextNumber); err != nil {
		return "", err
	}

	return fmt.Sprintf("BFA-%03d", nextNumber), nil
}

func rollback(ctx context.Context, tx pgx.Tx) {
	_ = tx.Rollback(ctx)
}

func isNoRows(err error) bool { return errors.Is(err, pgx.ErrNoRows) }

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}
