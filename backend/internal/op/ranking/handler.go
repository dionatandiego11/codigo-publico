package ranking

import (
	"encoding/json"
	"net/http"

	"codigo-publico/backend/internal/auth"
	"codigo-publico/backend/internal/web"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Handler expõe os endpoints HTTP do ranking do OP.
type Handler struct {
	service *Service
}

// NewHandler cria um handler com pool de banco.
func NewHandler(db *pgxpool.Pool) *Handler {
	return &Handler{service: NewService(NewRepository(db))}
}

// ServiceRef expõe o service para que o handler de votações possa chamar
// ComputeFromVoting ao encerrar uma votação.
func (h *Handler) ServiceRef() *Service {
	return h.service
}

// GET /op/cycles/{id}/ranking (público)
// Query param opcional: ?territory={territoryId}
func (h *Handler) ListRanking(w http.ResponseWriter, r *http.Request) {
	cycleID := chi.URLParam(r, "id")
	territoryID := r.URL.Query().Get("territory")

	items, err := h.service.ListByCycle(r.Context(), cycleID, territoryID)
	if err != nil {
		web.WriteError(w, err)
		return
	}
	web.WriteJSON(w, http.StatusOK, items)
}

// POST /admin/op/ranking/{id}/status (instância geral)
func (h *Handler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	citizenID, ok := auth.CitizenIDFromContext(r.Context())
	if !ok {
		web.WriteErrorMessage(w, http.StatusUnauthorized, "missing authenticated citizen")
		return
	}

	var input updateStatusInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		web.WriteErrorMessage(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	item, err := h.service.UpdateStatus(r.Context(), citizenID, chi.URLParam(r, "id"), input)
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusOK, item)
}
