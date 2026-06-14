// Package audit implementa a trilha de auditoria com hash encadeado.
//
// Cada evento carrega o hash do evento anterior (prev_hash) e o próprio hash
// (event_hash = SHA-256 do conteúdo + prev_hash). Qualquer alteração
// retroativa quebra a cadeia, tornando-a verificável. A cabeça da cadeia pode
// ser ancorada externamente (ver pacote blockchain) sem expor dados pessoais.
package audit

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// chainLockKey serializa os appends da cadeia (advisory lock transacional).
const chainLockKey int64 = 2026061100

// Actor identifica quem praticou a ação auditada.
type Actor struct {
	ID   string
	Name string
	Role string
	Type string // citizen | institutional | system
}

// Event descreve a ação auditada.
type Event struct {
	Action         string
	EntityType     string
	EntityID       string
	EntityPublicID string
	Metadata       map[string]any
}

// Insert grava o evento dentro da transação, encadeado ao evento anterior.
func Insert(ctx context.Context, tx pgx.Tx, actor Actor, event Event) error {
	if event.Metadata == nil {
		event.Metadata = map[string]any{}
	}

	metadataJSON, err := json.Marshal(event.Metadata)
	if err != nil {
		return err
	}

	if _, err := tx.Exec(ctx, "SELECT pg_advisory_xact_lock($1)", chainLockKey); err != nil {
		return err
	}

	var prevHash string
	err = tx.QueryRow(ctx, `
		SELECT COALESCE(event_hash, '')
		FROM audit_events
		WHERE event_hash IS NOT NULL
		ORDER BY created_at DESC
		LIMIT 1
	`).Scan(&prevHash)
	if err != nil && err != pgx.ErrNoRows {
		return err
	}

	eventHash := hashEvent(prevHash, actor, event, string(metadataJSON))

	_, err = tx.Exec(ctx, `
		INSERT INTO audit_events (
			actor_type,
			actor_id,
			actor_name,
			action,
			entity_type,
			entity_id,
			entity_public_id,
			metadata,
			prev_hash,
			event_hash
		)
		VALUES ($1, $2::uuid, $3, $4, $5, $6::uuid, $7, $8::jsonb, $9, $10)
	`,
		actor.Type,
		nullIfEmpty(actor.ID),   // ator "system" não tem UUID
		nullIfEmpty(actor.Name),
		event.Action,
		event.EntityType,
		event.EntityID,
		event.EntityPublicID,
		string(metadataJSON),
		nullIfEmpty(prevHash),
		eventHash,
	)

	return err
}

// ChainHead retorna o hash mais recente da cadeia e o total de eventos.
func ChainHead(ctx context.Context, db *pgxpool.Pool) (string, int64, error) {
	var head string
	err := db.QueryRow(ctx, `
		SELECT COALESCE(event_hash, '')
		FROM audit_events
		WHERE event_hash IS NOT NULL
		ORDER BY created_at DESC
		LIMIT 1
	`).Scan(&head)
	if err != nil && err != pgx.ErrNoRows {
		return "", 0, err
	}

	var count int64
	if err := db.QueryRow(ctx, `SELECT COUNT(*) FROM audit_events`).Scan(&count); err != nil {
		return "", 0, err
	}

	return head, count, nil
}

func hashEvent(prevHash string, actor Actor, event Event, metadataJSON string) string {
	payload := strings.Join([]string{
		prevHash,
		actor.Type,
		actor.ID,
		actor.Name,
		event.Action,
		event.EntityType,
		event.EntityID,
		event.EntityPublicID,
		metadataJSON,
	}, "|")

	sum := sha256.Sum256([]byte(payload))
	return hex.EncodeToString(sum[:])
}

func nullIfEmpty(value string) any {
	if value == "" {
		return nil
	}

	return value
}
