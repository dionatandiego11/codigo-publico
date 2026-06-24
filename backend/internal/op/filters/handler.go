package filters

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

func decodeBody[T any](w http.ResponseWriter, r *http.Request) (T, bool) {
	var input T
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		web.WriteErrorMessage(w, http.StatusBadRequest, "invalid JSON body")
		return input, false
	}
	return input, true
}

// GET /op/budget-filters?cycleId=&territoryId=&demandId=
func (h *Handler) ListFilters(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	filters, err := h.service.ListFilters(r.Context(), listFiltersInput{
		CycleID:     query.Get("cycleId"),
		TerritoryID: query.Get("territoryId"),
		DemandID:    query.Get("demandId"),
	})
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusOK, filters)
}

// POST /op/budget-filters/{id}/appeal
func (h *Handler) AppealFilter(w http.ResponseWriter, r *http.Request) {
	id, ok := citizenID(w, r)
	if !ok {
		return
	}
	input, ok := decodeBody[appealInput](w, r)
	if !ok {
		return
	}

	appeal, err := h.service.AppealFilter(r.Context(), id, chi.URLParam(r, "id"), input)
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusCreated, appeal)
}

// POST /admin/op/budget-filter-appeals/{id}/decision
func (h *Handler) DecideAppeal(w http.ResponseWriter, r *http.Request) {
	id, ok := citizenID(w, r)
	if !ok {
		return
	}
	input, ok := decodeBody[decideAppealInput](w, r)
	if !ok {
		return
	}

	appeal, err := h.service.DecideAppeal(r.Context(), id, chi.URLParam(r, "id"), input)
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusOK, appeal)
}
