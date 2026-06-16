package demands

import (
	"context"
	"database/sql"
	"fmt"
	"math"
	"time"

	"codigo-publico/backend/internal/audit"

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

type territoryRef struct {
	ID   string
	Slug string
	Name string
}

type currentCycle struct {
	ID    string
	Phase string
}

type demandRecord struct {
	ID               string
	PublicID         string
	CycleID          string
	CyclePhase       string
	TerritoryID      string
	Status           string
	Title            string
	Description      string
	Location         string
	Category         string
	GroupedIntoID    string
	Supports         int
	SupportThreshold int
}

const demandSelectSQL = `
	SELECT
		d.id::text,
		d.public_id,
		d.cycle_id::text,
		t.slug,
		t.name,
		d.title,
		d.description,
		d.location,
		d.category,
		d.author_name,
		d.status,
		d.supports_count,
		st.support_threshold,
		g.public_id,
		f.public_id,
		d.created_at,
		d.updated_at
	FROM budget_demands d
	JOIN op_cycles oc ON oc.id = d.cycle_id
	JOIN territories t ON t.id = d.territory_id
	LEFT JOIN budget_demands g ON g.id = d.grouped_into_demand_id
	LEFT JOIN budget_demands f ON f.id = d.forked_from_demand_id
	JOIN LATERAL (
		SELECT GREATEST(
			1,
			CEIL(COUNT(c.id)::numeric * COALESCE(NULLIF(oc.regimento->>'supportThresholdPct', '')::numeric, 3) / 100.0)::int
		) AS support_threshold
		FROM citizens c
		WHERE c.territory_id = d.territory_id
	) st ON TRUE
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

func (r *Repository) currentCycle(ctx context.Context) (currentCycle, error) {
	var cycle currentCycle
	err := r.db.QueryRow(ctx, `
		SELECT id::text, phase
		FROM op_cycles
		WHERE phase NOT IN ('Encerrado','Cancelado')
		ORDER BY created_at DESC
		LIMIT 1
	`).Scan(&cycle.ID, &cycle.Phase)
	return cycle, err
}

func (r *Repository) resolveTerritory(ctx context.Context, identifier string) (territoryRef, error) {
	var territory territoryRef
	err := r.db.QueryRow(ctx, `
		SELECT id::text, slug, name
		FROM territories
		WHERE id::text = $1 OR slug = $1 OR name = $1
	`, identifier).Scan(&territory.ID, &territory.Slug, &territory.Name)
	return territory, err
}

func (r *Repository) listDemands(ctx context.Context) ([]Demand, error) {
	rows, err := r.db.Query(ctx, demandSelectSQL+` ORDER BY d.created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanDemandRows(ctx, rows)
}

func (r *Repository) listDemandsByTerritory(ctx context.Context, territory territoryRef) ([]Demand, error) {
	rows, err := r.db.Query(ctx, demandSelectSQL+`
		WHERE d.territory_id = $1::uuid
		ORDER BY d.created_at DESC
	`, territory.ID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanDemandRows(ctx, rows)
}

func (r *Repository) getDemand(ctx context.Context, identifier string) (Demand, string, error) {
	demand, internalID, err := scanDemand(r.db.QueryRow(ctx, demandSelectSQL+`
		WHERE d.id::text = $1 OR d.public_id = $1
	`, identifier))
	if err != nil {
		return Demand{}, "", err
	}

	demand.Comments, err = r.commentsByDemandID(ctx, internalID)
	if err != nil {
		return Demand{}, "", err
	}
	demand.Links, err = r.linksByDemandID(ctx, internalID)
	if err != nil {
		return Demand{}, "", err
	}

	return demand, internalID, nil
}

func (r *Repository) demandRecord(ctx context.Context, identifier string) (demandRecord, error) {
	var rec demandRecord
	err := r.db.QueryRow(ctx, `
		SELECT
			d.id::text,
			d.public_id,
			d.cycle_id::text,
			oc.phase,
			d.territory_id::text,
			d.status,
			d.title,
			d.description,
			d.location,
			d.category,
			COALESCE(d.grouped_into_demand_id::text, ''),
			d.supports_count,
			GREATEST(
				1,
				CEIL(COUNT(c.id)::numeric * COALESCE(NULLIF(oc.regimento->>'supportThresholdPct', '')::numeric, 3) / 100.0)::int
			) AS support_threshold
		FROM budget_demands d
		JOIN op_cycles oc ON oc.id = d.cycle_id
		LEFT JOIN citizens c ON c.territory_id = d.territory_id
		WHERE d.id::text = $1 OR d.public_id = $1
		GROUP BY d.id, d.public_id, d.cycle_id, oc.phase, d.territory_id, d.status, d.title, d.description, d.location, d.category, d.grouped_into_demand_id, d.supports_count, oc.regimento
	`, identifier).Scan(
		&rec.ID,
		&rec.PublicID,
		&rec.CycleID,
		&rec.CyclePhase,
		&rec.TerritoryID,
		&rec.Status,
		&rec.Title,
		&rec.Description,
		&rec.Location,
		&rec.Category,
		&rec.GroupedIntoID,
		&rec.Supports,
		&rec.SupportThreshold,
	)

	return rec, err
}

func (r *Repository) hasDemandAuthority(ctx context.Context, a actor, territoryID string) (bool, error) {
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

func (r *Repository) groupDemand(ctx context.Context, a actor, source demandRecord, target demandRecord, reason string) (Demand, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return Demand{}, err
	}
	defer rollback(ctx, tx)

	if _, err := tx.Exec(ctx, `
		UPDATE budget_demands
		SET status = 'Agrupada', grouped_into_demand_id = $1::uuid
		WHERE id = $2::uuid
	`, target.ID, source.ID); err != nil {
		return Demand{}, err
	}

	if _, err := tx.Exec(ctx, `
		INSERT INTO budget_demand_links (source_demand_id, target_demand_id, link_type, reason, created_by)
		VALUES ($1::uuid, $2::uuid, 'grouped', $3, $4::uuid)
		ON CONFLICT (source_demand_id, target_demand_id, link_type)
		DO UPDATE SET reason = EXCLUDED.reason, created_by = EXCLUDED.created_by, created_at = NOW()
	`, source.ID, target.ID, reason, a.ID); err != nil {
		return Demand{}, err
	}

	if err := insertAudit(ctx, tx, a, "op.demand.grouped", source.ID, source.PublicID, map[string]any{
		"targetDemandId": target.PublicID,
		"reason":         reason,
	}); err != nil {
		return Demand{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return Demand{}, err
	}

	demand, _, err := r.getDemand(ctx, source.PublicID)
	return demand, err
}

func (r *Repository) forkDemand(ctx context.Context, a actor, source demandRecord, input forkDemandInput) (Demand, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return Demand{}, err
	}
	defer rollback(ctx, tx)

	publicID, err := nextDemandPublicID(ctx, tx)
	if err != nil {
		return Demand{}, err
	}

	var forkID string
	err = tx.QueryRow(ctx, `
		INSERT INTO budget_demands (
			public_id,
			cycle_id,
			territory_id,
			title,
			description,
			location,
			category,
			author_citizen_id,
			author_name,
			status,
			supports_count,
			forked_from_demand_id
		)
		VALUES ($1, $2::uuid, $3::uuid, $4, $5, $6, $7, $8::uuid, $9, 'Recebida', 1, $10::uuid)
		RETURNING id::text
	`, publicID, source.CycleID, source.TerritoryID, input.Title, input.Description, input.Location, input.Category, a.ID, a.Name, source.ID).Scan(&forkID)
	if err != nil {
		return Demand{}, err
	}

	if _, err := tx.Exec(ctx, `
		INSERT INTO budget_demand_supports (demand_id, citizen_id)
		VALUES ($1::uuid, $2::uuid)
	`, forkID, a.ID); err != nil {
		return Demand{}, err
	}

	if _, err := tx.Exec(ctx, `
		INSERT INTO budget_demand_links (source_demand_id, target_demand_id, link_type, reason, created_by)
		VALUES ($1::uuid, $2::uuid, 'fork', $3, $4::uuid)
		ON CONFLICT (source_demand_id, target_demand_id, link_type) DO NOTHING
	`, source.ID, forkID, input.Reason, a.ID); err != nil {
		return Demand{}, err
	}

	if err := insertAudit(ctx, tx, a, "op.demand.forked", forkID, publicID, map[string]any{
		"sourceDemandId": source.PublicID,
		"reason":         input.Reason,
	}); err != nil {
		return Demand{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return Demand{}, err
	}

	demand, _, err := r.getDemand(ctx, publicID)
	return demand, err
}

func (r *Repository) createDemand(ctx context.Context, a actor, cycle currentCycle, territory territoryRef, input createDemandInput) (Demand, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return Demand{}, err
	}
	defer rollback(ctx, tx)

	publicID, err := nextDemandPublicID(ctx, tx)
	if err != nil {
		return Demand{}, err
	}

	var internalID string
	err = tx.QueryRow(ctx, `
		INSERT INTO budget_demands (
			public_id,
			cycle_id,
			territory_id,
			title,
			description,
			location,
			category,
			author_citizen_id,
			author_name,
			status,
			supports_count
		)
		VALUES ($1, $2::uuid, $3::uuid, $4, $5, $6, $7, $8::uuid, $9, 'Recebida', 1)
		RETURNING id::text
	`, publicID, cycle.ID, territory.ID, input.Title, input.Description, input.Location, input.Category, a.ID, a.Name).Scan(&internalID)
	if err != nil {
		return Demand{}, err
	}

	if _, err := tx.Exec(ctx, `
		INSERT INTO budget_demand_supports (demand_id, citizen_id)
		VALUES ($1::uuid, $2::uuid)
	`, internalID, a.ID); err != nil {
		return Demand{}, err
	}

	if err := insertAudit(ctx, tx, a, "op.demand.created", internalID, publicID, map[string]any{
		"cycleId":     cycle.ID,
		"territoryId": territory.Slug,
		"title":       input.Title,
		"category":    input.Category,
	}); err != nil {
		return Demand{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return Demand{}, err
	}

	demand, _, err := r.getDemand(ctx, publicID)
	return demand, err
}

func (r *Repository) supportDemand(ctx context.Context, a actor, identifier string) (Demand, error) {
	demand, internalID, err := r.getDemand(ctx, identifier)
	if err != nil {
		return Demand{}, err
	}

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return Demand{}, err
	}
	defer rollback(ctx, tx)

	inserted, err := insertSupport(ctx, tx, internalID, a.ID)
	if err != nil {
		return Demand{}, err
	}

	if inserted {
		if _, err := tx.Exec(ctx, `
			UPDATE budget_demands
			SET
				supports_count = supports_count + 1,
				status = CASE
					WHEN status = 'Recebida' THEN 'Engajamento inicial'
					ELSE status
				END
			WHERE id = $1::uuid
		`, internalID); err != nil {
			return Demand{}, err
		}

		if err := insertAudit(ctx, tx, a, "op.demand.supported", internalID, demand.ID, nil); err != nil {
			return Demand{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return Demand{}, err
	}

	updated, _, err := r.getDemand(ctx, demand.ID)
	return updated, err
}

func (r *Repository) transitionDemandStatus(ctx context.Context, a actor, rec demandRecord, newStatus string, action string, reason string) (Demand, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return Demand{}, err
	}
	defer rollback(ctx, tx)

	var currentStatus string
	if err := tx.QueryRow(ctx, `
		SELECT status
		FROM budget_demands
		WHERE id = $1::uuid
		FOR UPDATE
	`, rec.ID).Scan(&currentStatus); err != nil {
		return Demand{}, err
	}

	if _, err := tx.Exec(ctx, `
		UPDATE budget_demands
		SET status = $1
		WHERE id = $2::uuid
	`, newStatus, rec.ID); err != nil {
		return Demand{}, err
	}

	if err := insertAudit(ctx, tx, a, action, rec.ID, rec.PublicID, map[string]any{
		"fromStatus": currentStatus,
		"toStatus":   newStatus,
		"reason":     reason,
	}); err != nil {
		return Demand{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return Demand{}, err
	}

	demand, _, err := r.getDemand(ctx, rec.PublicID)
	return demand, err
}

func (r *Repository) createComment(ctx context.Context, a actor, identifier string, input createCommentInput) (DemandComment, error) {
	demand, internalID, err := r.getDemand(ctx, identifier)
	if err != nil {
		return DemandComment{}, err
	}

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return DemandComment{}, err
	}
	defer rollback(ctx, tx)

	var comment DemandComment
	var createdAt time.Time
	err = tx.QueryRow(ctx, `
		INSERT INTO budget_demand_comments (demand_id, citizen_id, author_name, content)
		VALUES ($1::uuid, $2::uuid, $3, $4)
		RETURNING id::text, author_name, content, created_at
	`, internalID, a.ID, a.Name, input.Content).Scan(&comment.ID, &comment.AuthorName, &comment.Content, &createdAt)
	if err != nil {
		return DemandComment{}, err
	}

	if err := insertAudit(ctx, tx, a, "op.demand.comment.created", internalID, demand.ID, map[string]any{
		"commentId": comment.ID,
	}); err != nil {
		return DemandComment{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return DemandComment{}, err
	}

	comment.CreatedAt = formatTime(createdAt)
	return comment, nil
}

func (r *Repository) scanDemandRows(ctx context.Context, rows pgx.Rows) ([]Demand, error) {
	demands := make([]Demand, 0)
	for rows.Next() {
		demand, internalID, err := scanDemand(rows)
		if err != nil {
			return nil, err
		}

		demand.Comments, err = r.commentsByDemandID(ctx, internalID)
		if err != nil {
			return nil, err
		}
		demand.Links, err = r.linksByDemandID(ctx, internalID)
		if err != nil {
			return nil, err
		}

		demands = append(demands, demand)
	}

	return demands, rows.Err()
}

func scanDemand(row rowScanner) (Demand, string, error) {
	var demand Demand
	var internalID string
	var groupedInto sql.NullString
	var forkedFrom sql.NullString
	var createdAt time.Time
	var updatedAt time.Time

	err := row.Scan(
		&internalID,
		&demand.ID,
		&demand.CycleID,
		&demand.TerritoryID,
		&demand.TerritoryName,
		&demand.Title,
		&demand.Description,
		&demand.Location,
		&demand.Category,
		&demand.AuthorName,
		&demand.Status,
		&demand.Supports,
		&demand.SupportThreshold,
		&groupedInto,
		&forkedFrom,
		&createdAt,
		&updatedAt,
	)
	if err != nil {
		return Demand{}, "", err
	}
	if groupedInto.Valid {
		demand.GroupedIntoDemandID = &groupedInto.String
	}
	if forkedFrom.Valid {
		demand.ForkedFromDemandID = &forkedFrom.String
	}

	demand.CreatedAt = formatTime(createdAt)
	demand.UpdatedAt = formatTime(updatedAt)
	demand.SupportReached = demand.Supports >= demand.SupportThreshold
	demand.SupportProgressPercent = supportProgressPercent(demand.Supports, demand.SupportThreshold)
	demand.Links = []DemandLink{}
	demand.Comments = []DemandComment{}

	return demand, internalID, nil
}

func (r *Repository) linksByDemandID(ctx context.Context, demandID string) ([]DemandLink, error) {
	rows, err := r.db.Query(ctx, `
		SELECT
			CASE
				WHEN l.link_type = 'grouped' AND l.source_demand_id = $1::uuid THEN 'grouped_into'
				WHEN l.link_type = 'grouped' AND l.target_demand_id = $1::uuid THEN 'grouped_from'
				WHEN l.link_type = 'fork' AND l.source_demand_id = $1::uuid THEN 'fork'
				WHEN l.link_type = 'fork' AND l.target_demand_id = $1::uuid THEN 'forked_from'
				ELSE l.link_type
			END AS relation_type,
			other.public_id,
			other.title,
			other.status,
			l.reason,
			l.created_at
		FROM budget_demand_links l
		JOIN budget_demands other ON other.id = CASE
			WHEN l.source_demand_id = $1::uuid THEN l.target_demand_id
			ELSE l.source_demand_id
		END
		WHERE l.source_demand_id = $1::uuid OR l.target_demand_id = $1::uuid
		ORDER BY l.created_at DESC
	`, demandID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	links := make([]DemandLink, 0)
	for rows.Next() {
		var link DemandLink
		var createdAt time.Time
		if err := rows.Scan(&link.Type, &link.DemandID, &link.DemandTitle, &link.DemandStatus, &link.Reason, &createdAt); err != nil {
			return nil, err
		}
		link.CreatedAt = formatTime(createdAt)
		links = append(links, link)
	}

	return links, rows.Err()
}

func (r *Repository) commentsByDemandID(ctx context.Context, demandID string) ([]DemandComment, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id::text, author_name, content, created_at
		FROM budget_demand_comments
		WHERE demand_id = $1::uuid
		ORDER BY created_at ASC
	`, demandID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	comments := make([]DemandComment, 0)
	for rows.Next() {
		var comment DemandComment
		var createdAt time.Time
		if err := rows.Scan(&comment.ID, &comment.AuthorName, &comment.Content, &createdAt); err != nil {
			return nil, err
		}
		comment.CreatedAt = formatTime(createdAt)
		comments = append(comments, comment)
	}

	return comments, rows.Err()
}

func nextDemandPublicID(ctx context.Context, tx pgx.Tx) (string, error) {
	if _, err := tx.Exec(ctx, "SELECT pg_advisory_xact_lock($1)", int64(2026061601)); err != nil {
		return "", err
	}

	var nextNumber int
	if err := tx.QueryRow(ctx, `
		SELECT COALESCE(MAX(substring(public_id from 3)::int), 0) + 1
		FROM budget_demands
		WHERE public_id ~ '^D-[0-9]+$'
	`).Scan(&nextNumber); err != nil {
		return "", err
	}

	return fmt.Sprintf("D-%03d", nextNumber), nil
}

func insertSupport(ctx context.Context, tx pgx.Tx, demandID string, citizenID string) (bool, error) {
	command, err := tx.Exec(ctx, `
		INSERT INTO budget_demand_supports (demand_id, citizen_id)
		VALUES ($1::uuid, $2::uuid)
		ON CONFLICT (demand_id, citizen_id) DO NOTHING
	`, demandID, citizenID)
	if err != nil {
		return false, err
	}

	return command.RowsAffected() > 0, nil
}

func insertAudit(ctx context.Context, tx pgx.Tx, a actor, action string, entityID string, publicID string, metadata map[string]any) error {
	if metadata == nil {
		metadata = map[string]any{}
	}
	metadata["actorRole"] = a.Role

	return audit.Insert(ctx, tx, audit.Actor{
		ID:   a.ID,
		Name: a.Name,
		Role: a.Role,
		Type: "citizen",
	}, audit.Event{
		Action:         action,
		EntityType:     "budget_demand",
		EntityID:       entityID,
		EntityPublicID: publicID,
		Metadata:       metadata,
	})
}

func rollback(ctx context.Context, tx pgx.Tx) {
	_ = tx.Rollback(ctx)
}

func formatTime(value time.Time) string {
	return value.UTC().Format(time.RFC3339)
}

func supportProgressPercent(supports int, threshold int) float64 {
	if threshold <= 0 {
		return 100
	}

	percent := (float64(supports) / float64(threshold)) * 100
	if percent > 100 {
		percent = 100
	}

	return math.Round(percent*100) / 100
}
