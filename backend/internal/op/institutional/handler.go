package institutional

import (
	"encoding/json"
	"net/http"

	"codigo-publico/backend/internal/auth"
	"codigo-publico/backend/internal/web"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Handler struct {
	service *Service
}

func NewHandler(db *pgxpool.Pool) *Handler {
	return &Handler{service: NewService(NewRepository(db))}
}

func citizenID(w http.ResponseWriter, r *http.Request) (string, bool) {
	id, ok := auth.CitizenIDFromContext(r.Context())
	if !ok {
		web.WriteErrorMessage(w, http.StatusUnauthorized, "missing authenticated citizen")
		return "", false
	}
	return id, true
}

// POST /admin/op/proposals/{id}/institutional-decision
func (h *Handler) DecideInstitutional(w http.ResponseWriter, r *http.Request) {
	id, ok := citizenID(w, r)
	if !ok {
		return
	}
	var input institutionalDecisionInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		web.WriteErrorMessage(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	result, err := h.service.DecideInstitutional(r.Context(), id, chi.URLParam(r, "id"), input)
	if err != nil {
		web.WriteError(w, err)
		return
	}
	web.WriteJSON(w, http.StatusOK, result)
}

// GET /op/divergence-incidents (público)
func (h *Handler) ListIncidents(w http.ResponseWriter, r *http.Request) {
	incidents, err := h.service.ListIncidents(r.Context())
	if err != nil {
		web.WriteError(w, err)
		return
	}
	web.WriteJSON(w, http.StatusOK, incidents)
}
