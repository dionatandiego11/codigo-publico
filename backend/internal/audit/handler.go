package audit

import (
	"net/http"
	"time"

	"codigo-publico/backend/internal/auth"
	"codigo-publico/backend/internal/blockchain"
	"codigo-publico/backend/internal/web"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Handler expõe a integridade da trilha de auditoria: cabeça da cadeia,
// âncoras registradas e o disparo de uma nova ancoragem.
type Handler struct {
	db       *pgxpool.Pool
	anchorer blockchain.Anchorer
}

func NewHandler(db *pgxpool.Pool, anchorer blockchain.Anchorer) *Handler {
	return &Handler{db: db, anchorer: anchorer}
}

type chainHeadResponse struct {
	ChainHeadHash string `json:"chainHeadHash"`
	EventsCount   int64  `json:"eventsCount"`
}

type anchorResponse struct {
	ID            string `json:"id"`
	ChainHeadHash string `json:"chainHeadHash"`
	EventsCount   int64  `json:"eventsCount"`
	AnchoredVia   string `json:"anchoredVia"`
	TxRef         string `json:"txRef,omitempty"`
	CreatedAt     string `json:"createdAt"`
}

// GetChainHead é público: qualquer pessoa pode conferir a cabeça da cadeia.
func (h *Handler) GetChainHead(w http.ResponseWriter, r *http.Request) {
	head, count, err := ChainHead(r.Context(), h.db)
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusOK, chainHeadResponse{ChainHeadHash: head, EventsCount: count})
}

// ListAnchors é público: as âncoras são provas de integridade, não segredos.
func (h *Handler) ListAnchors(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(r.Context(), `
		SELECT id::text, chain_head_hash, events_count, anchored_via, COALESCE(tx_ref, ''), created_at
		FROM audit_anchors
		ORDER BY created_at DESC
		LIMIT 100
	`)
	if err != nil {
		web.WriteError(w, err)
		return
	}
	defer rows.Close()

	anchors := make([]anchorResponse, 0)
	for rows.Next() {
		var anchor anchorResponse
		var createdAt time.Time
		if err := rows.Scan(&anchor.ID, &anchor.ChainHeadHash, &anchor.EventsCount, &anchor.AnchoredVia, &anchor.TxRef, &createdAt); err != nil {
			web.WriteError(w, err)
			return
		}
		anchor.CreatedAt = createdAt.UTC().Format(time.RFC3339)
		anchors = append(anchors, anchor)
	}
	if err := rows.Err(); err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusOK, anchors)
}

// CreateAnchor exige papel administrativo e registra a cabeça atual da cadeia.
func (h *Handler) CreateAnchor(w http.ResponseWriter, r *http.Request) {
	citizenID, ok := auth.CitizenIDFromContext(r.Context())
	if !ok {
		web.WriteErrorMessage(w, http.StatusUnauthorized, "missing authenticated citizen")
		return
	}

	var role string
	if err := h.db.QueryRow(r.Context(), `
		SELECT role FROM citizens WHERE id = $1::uuid
	`, citizenID).Scan(&role); err != nil {
		web.WriteErrorMessage(w, http.StatusUnauthorized, "citizen not found")
		return
	}

	if role != "sysadmin" && role != "admin" && role != "institutional_admin" {
		web.WriteErrorMessage(w, http.StatusForbidden, "audit anchoring requires an administrative role")
		return
	}

	head, count, err := ChainHead(r.Context(), h.db)
	if err != nil {
		web.WriteError(w, err)
		return
	}

	if head == "" {
		web.WriteErrorMessage(w, http.StatusConflict, "audit chain is empty; nothing to anchor")
		return
	}

	txRef, err := h.anchorer.Anchor(r.Context(), head)
	if err != nil {
		web.WriteErrorMessage(w, http.StatusBadGateway, "failed to anchor chain head externally")
		return
	}

	var anchor anchorResponse
	var createdAt time.Time
	err = h.db.QueryRow(r.Context(), `
		INSERT INTO audit_anchors (chain_head_hash, events_count, anchored_via, tx_ref)
		VALUES ($1, $2, $3, $4)
		RETURNING id::text, chain_head_hash, events_count, anchored_via, COALESCE(tx_ref, ''), created_at
	`, head, count, h.anchorer.Name(), nullIfEmpty(txRef)).Scan(
		&anchor.ID, &anchor.ChainHeadHash, &anchor.EventsCount, &anchor.AnchoredVia, &anchor.TxRef, &createdAt,
	)
	if err != nil {
		web.WriteError(w, err)
		return
	}
	anchor.CreatedAt = createdAt.UTC().Format(time.RFC3339)

	web.WriteJSON(w, http.StatusCreated, anchor)
}
