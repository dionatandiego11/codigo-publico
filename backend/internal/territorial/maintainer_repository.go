package territorial

import (
	"context"
	"database/sql"
	"net/http"
	"time"

	"codigo-publico/backend/internal/audit"
	"codigo-publico/backend/internal/web"
)

const maintainerSelectSQL = `
	SELECT
		m.id::text,
		m.territory_id::text,
		t.name,
		m.citizen_id::text,
		c.full_name,
		m.scope,
		m.status,
		m.appointment_source,
		m.term_start,
		m.term_end,
		m.mandate_note,
		m.created_at
	FROM territory_maintainers m
	LEFT JOIN territories t ON t.id = m.territory_id
	JOIN citizens c ON c.id = m.citizen_id
`

func scanMaintainer(row rowScanner) (Maintainer, error) {
	var m Maintainer
	var territoryID sql.NullString
	var territoryName sql.NullString
	var source sql.NullString
	var termStart sql.NullTime
	var termEnd sql.NullTime
	var note sql.NullString
	var createdAt time.Time

	err := row.Scan(
		&m.ID, &territoryID, &territoryName, &m.CitizenID, &m.CitizenName,
		&m.Scope, &m.Status, &source, &termStart, &termEnd, &note, &createdAt,
	)
	if err != nil {
		return Maintainer{}, err
	}

	m.TerritoryID = territoryID.String
	m.TerritoryName = territoryName.String
	m.AppointmentSource = nullStringPtr(source)
	m.TermStart = nullTimePtr(termStart)
	m.TermEnd = nullTimePtr(termEnd)
	m.MandateNote = nullStringPtr(note)
	m.CreatedAt = createdAt.UTC().Format(time.RFC3339)

	return m, nil
}

// maintainerRecord é a visão interna usada nas decisões (sem dados de exibição).
type maintainerRecord struct {
	ID          string
	TerritoryID string
	CitizenID   string
	Scope       string
	Status      string
}

func (r *Repository) getMaintainer(ctx context.Context, maintainerID string) (maintainerRecord, error) {
	var rec maintainerRecord
	var territoryID sql.NullString
	err := r.db.QueryRow(ctx, `
		SELECT id::text, territory_id::text, citizen_id::text, scope, status
		FROM territory_maintainers
		WHERE id = $1::uuid
	`, maintainerID).Scan(&rec.ID, &territoryID, &rec.CitizenID, &rec.Scope, &rec.Status)
	rec.TerritoryID = territoryID.String

	return rec, err
}

func (r *Repository) getMaintainerView(ctx context.Context, maintainerID string) (Maintainer, error) {
	return scanMaintainer(r.db.QueryRow(ctx, maintainerSelectSQL+` WHERE m.id = $1::uuid`, maintainerID))
}

func (r *Repository) listMaintainers(ctx context.Context, territoryID string) ([]Maintainer, error) {
	rows, err := r.db.Query(ctx, maintainerSelectSQL+` WHERE m.territory_id = $1::uuid ORDER BY m.created_at DESC`, territoryID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := make([]Maintainer, 0)
	for rows.Next() {
		m, err := scanMaintainer(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, m)
	}

	return list, rows.Err()
}

func (r *Repository) appointMaintainer(ctx context.Context, actor actor, territoryID, citizenID, scope, source, status string, termStart, termEnd time.Time, note string) (Maintainer, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return Maintainer{}, err
	}
	defer rollback(ctx, tx)

	var id string
	err = tx.QueryRow(ctx, `
		INSERT INTO territory_maintainers
			(territory_id, citizen_id, scope, status, appointment_source, term_start, term_end, mandate_note, appointed_by)
		VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id::text
	`, nullIfEmpty(territoryID), citizenID, scope, status, source, termStart, termEnd, nullIfEmpty(note), actor.Name).Scan(&id)
	if err != nil {
		if isUniqueViolation(err) {
			return Maintainer{}, web.NewError(http.StatusConflict, "territory already has an effective territorial maintainer")
		}
		return Maintainer{}, err
	}

	if err := audit.Insert(ctx, tx, institutionalAuditActor(actor), audit.Event{
		Action:         "maintainer.appointed",
		EntityType:     "territory_maintainer",
		EntityID:       id,
		EntityPublicID: id,
		Metadata:       map[string]any{"scope": scope, "status": status, "source": source, "territoryId": territoryID},
	}); err != nil {
		return Maintainer{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return Maintainer{}, err
	}

	return r.getMaintainerView(ctx, id)
}

// transitionMaintainer aplica uma mudança de status já validada pela política,
// opcionalmente ajustando o fim do mandato, com lock e auditoria.
func (r *Repository) transitionMaintainer(ctx context.Context, actor actor, auditActor audit.Actor, maintainerID, expectedStatus, newStatus string, newTermEnd *time.Time, reason, action string) (Maintainer, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return Maintainer{}, err
	}
	defer rollback(ctx, tx)

	var current string
	if err := tx.QueryRow(ctx, `
		SELECT status FROM territory_maintainers WHERE id = $1::uuid FOR UPDATE
	`, maintainerID).Scan(&current); err != nil {
		return Maintainer{}, err
	}
	if expectedStatus != "" && current != expectedStatus {
		return Maintainer{}, web.NewError(http.StatusConflict, "maintainer is not in the expected state for this action")
	}

	if newTermEnd != nil {
		_, err = tx.Exec(ctx, `
			UPDATE territory_maintainers SET status = $1, term_end = $2, mandate_note = COALESCE($3, mandate_note)
			WHERE id = $4::uuid
		`, newStatus, *newTermEnd, nullIfEmpty(reason), maintainerID)
	} else {
		_, err = tx.Exec(ctx, `
			UPDATE territory_maintainers SET status = $1, mandate_note = COALESCE($2, mandate_note)
			WHERE id = $3::uuid
		`, newStatus, nullIfEmpty(reason), maintainerID)
	}
	if err != nil {
		if isUniqueViolation(err) {
			return Maintainer{}, web.NewError(http.StatusConflict, "territory already has an effective territorial maintainer")
		}
		return Maintainer{}, err
	}

	if err := audit.Insert(ctx, tx, auditActor, audit.Event{
		Action:         action,
		EntityType:     "territory_maintainer",
		EntityID:       maintainerID,
		EntityPublicID: maintainerID,
		Metadata:       map[string]any{"fromStatus": current, "toStatus": newStatus, "reason": reason},
	}); err != nil {
		return Maintainer{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return Maintainer{}, err
	}

	return r.getMaintainerView(ctx, maintainerID)
}

// countSeniorActiveBonds conta vínculos T3+ aprovados no território — base do
// quórum de recall.
func (r *Repository) countSeniorActiveBonds(ctx context.Context, territoryID string) (int, error) {
	var count int
	err := r.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM territory_bonds
		WHERE territory_id = $1::uuid AND status = 'Aprovado' AND trust_level IN ('T3', 'T4')
	`, territoryID).Scan(&count)

	return count, err
}

// ── Recall ────────────────────────────────────────────────────────────────────

type recallRecord struct {
	ID             string
	MaintainerID   string
	TerritoryID    string
	Status         string
	QuorumRequired int
}

func (r *Repository) getRecall(ctx context.Context, motionID string) (recallRecord, error) {
	var rec recallRecord
	err := r.db.QueryRow(ctx, `
		SELECT id::text, maintainer_id::text, territory_id::text, status, quorum_required
		FROM maintainer_recall_motions
		WHERE id = $1::uuid
	`, motionID).Scan(&rec.ID, &rec.MaintainerID, &rec.TerritoryID, &rec.Status, &rec.QuorumRequired)

	return rec, err
}

func (r *Repository) signatureCount(ctx context.Context, motionID string) (int, error) {
	var count int
	err := r.db.QueryRow(ctx, `SELECT COUNT(*) FROM maintainer_recall_signatures WHERE motion_id = $1::uuid`, motionID).Scan(&count)
	return count, err
}

func (r *Repository) openRecall(ctx context.Context, opener actor, maintainerID, territoryID, reason string, quorum int) (RecallMotion, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return RecallMotion{}, err
	}
	defer rollback(ctx, tx)

	var motion RecallMotion
	var createdAt time.Time
	err = tx.QueryRow(ctx, `
		INSERT INTO maintainer_recall_motions (maintainer_id, territory_id, opened_by, reason, quorum_required)
		VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5)
		RETURNING id::text, maintainer_id::text, territory_id::text, reason, status, quorum_required, created_at
	`, maintainerID, territoryID, opener.ID, reason, quorum).Scan(
		&motion.ID, &motion.MaintainerID, &motion.TerritoryID, &motion.Reason, &motion.Status, &motion.QuorumRequired, &createdAt,
	)
	if err != nil {
		if isUniqueViolation(err) {
			return RecallMotion{}, web.NewError(http.StatusConflict, "this maintainer already has an open recall motion")
		}
		return RecallMotion{}, err
	}
	motion.CreatedAt = createdAt.UTC().Format(time.RFC3339)

	// Maintainer entra em revisão ao abrir a moção (continua com poderes até a
	// decisão; a revisão apenas sinaliza o processo).
	if _, err := tx.Exec(ctx, `
		UPDATE territory_maintainers SET status = 'Em revisão'
		WHERE id = $1::uuid AND status IN ('Provisório', 'Ativo')
	`, maintainerID); err != nil {
		return RecallMotion{}, err
	}

	if err := audit.Insert(ctx, tx, citizenAuditActor(opener), audit.Event{
		Action:         "maintainer.recall_opened",
		EntityType:     "recall_motion",
		EntityID:       motion.ID,
		EntityPublicID: motion.ID,
		Metadata:       map[string]any{"maintainerId": maintainerID, "quorumRequired": quorum},
	}); err != nil {
		return RecallMotion{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return RecallMotion{}, err
	}

	motion.Signatures = 0
	return motion, nil
}

// signRecall registra a assinatura e, se o quórum for atingido, aprova a moção
// e destitui o maintainer — tudo na mesma transação.
func (r *Repository) signRecall(ctx context.Context, signer actor, rec recallRecord) (RecallMotion, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return RecallMotion{}, err
	}
	defer rollback(ctx, tx)

	_, err = tx.Exec(ctx, `
		INSERT INTO maintainer_recall_signatures (motion_id, citizen_id)
		VALUES ($1::uuid, $2::uuid)
		ON CONFLICT (motion_id, citizen_id) DO NOTHING
	`, rec.ID, signer.ID)
	if err != nil {
		return RecallMotion{}, err
	}

	var signatures int
	if err := tx.QueryRow(ctx, `SELECT COUNT(*) FROM maintainer_recall_signatures WHERE motion_id = $1::uuid`, rec.ID).Scan(&signatures); err != nil {
		return RecallMotion{}, err
	}

	status := RecallStatusOpen
	if RecallReached(signatures, rec.QuorumRequired) {
		status = RecallStatusApproved

		if _, err := tx.Exec(ctx, `
			UPDATE maintainer_recall_motions SET status = 'Aprovada', decided_at = NOW() WHERE id = $1::uuid
		`, rec.ID); err != nil {
			return RecallMotion{}, err
		}
		// Moção popular aprovada destitui o maintainer.
		if _, err := tx.Exec(ctx, `
			UPDATE territory_maintainers SET status = 'Destituído', term_end = NOW() WHERE id = $1::uuid
		`, rec.MaintainerID); err != nil {
			return RecallMotion{}, err
		}

		if err := audit.Insert(ctx, tx, citizenAuditActor(signer), audit.Event{
			Action:         "maintainer.recalled",
			EntityType:     "recall_motion",
			EntityID:       rec.ID,
			EntityPublicID: rec.ID,
			Metadata:       map[string]any{"maintainerId": rec.MaintainerID, "signatures": signatures, "quorumRequired": rec.QuorumRequired},
		}); err != nil {
			return RecallMotion{}, err
		}
	} else {
		if err := audit.Insert(ctx, tx, citizenAuditActor(signer), audit.Event{
			Action:         "maintainer.recall_signed",
			EntityType:     "recall_motion",
			EntityID:       rec.ID,
			EntityPublicID: rec.ID,
			Metadata:       map[string]any{"signatures": signatures, "quorumRequired": rec.QuorumRequired},
		}); err != nil {
			return RecallMotion{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return RecallMotion{}, err
	}

	return RecallMotion{
		ID:             rec.ID,
		MaintainerID:   rec.MaintainerID,
		TerritoryID:    rec.TerritoryID,
		Status:         status,
		QuorumRequired: rec.QuorumRequired,
		Signatures:     signatures,
	}, nil
}
