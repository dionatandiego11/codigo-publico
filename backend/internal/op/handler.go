package op

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

func decodeBody[T any](w http.ResponseWriter, r *http.Request) (T, bool) {
	var input T
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		web.WriteErrorMessage(w, http.StatusBadRequest, "invalid JSON body")
		return input, false
	}
	return input, true
}

func citizenID(w http.ResponseWriter, r *http.Request) (string, bool) {
	id, ok := auth.CitizenIDFromContext(r.Context())
	if !ok {
		web.WriteErrorMessage(w, http.StatusUnauthorized, "missing authenticated citizen")
		return "", false
	}
	return id, true
}

// POST /admin/op/cycles
func (h *Handler) CreateCycle(w http.ResponseWriter, r *http.Request) {
	id, ok := citizenID(w, r)
	if !ok {
		return
	}
	input, ok := decodeBody[createCycleInput](w, r)
	if !ok {
		return
	}

	cycle, err := h.service.CreateCycle(r.Context(), id, input)
	if err != nil {
		web.WriteError(w, err)
		return
	}
	web.WriteJSON(w, http.StatusCreated, cycle)
}

// POST /admin/op/cycles/{id}/configure
func (h *Handler) ConfigureCycle(w http.ResponseWriter, r *http.Request) {
	id, ok := citizenID(w, r)
	if !ok {
		return
	}
	input, ok := decodeBody[configureCycleInput](w, r)
	if !ok {
		return
	}

	cycle, err := h.service.ConfigureCycle(r.Context(), id, chi.URLParam(r, "id"), input)
	if err != nil {
		web.WriteError(w, err)
		return
	}
	web.WriteJSON(w, http.StatusOK, cycle)
}

// POST /admin/op/cycles/{id}/advance
func (h *Handler) AdvanceCycle(w http.ResponseWriter, r *http.Request) {
	id, ok := citizenID(w, r)
	if !ok {
		return
	}
	input, ok := decodeBody[advanceCycleInput](w, r)
	if !ok {
		return
	}

	cycle, err := h.service.AdvanceCycle(r.Context(), id, chi.URLParam(r, "id"), input)
	if err != nil {
		web.WriteError(w, err)
		return
	}
	web.WriteJSON(w, http.StatusOK, cycle)
}

// POST /admin/op/cycles/{id}/cancel
func (h *Handler) CancelCycle(w http.ResponseWriter, r *http.Request) {
	id, ok := citizenID(w, r)
	if !ok {
		return
	}
	input, ok := decodeBody[cancelCycleInput](w, r)
	if !ok {
		return
	}

	cycle, err := h.service.CancelCycle(r.Context(), id, chi.URLParam(r, "id"), input)
	if err != nil {
		web.WriteError(w, err)
		return
	}
	web.WriteJSON(w, http.StatusOK, cycle)
}

// POST /admin/op/envelope/preview
func (h *Handler) PreviewEnvelope(w http.ResponseWriter, r *http.Request) {
	id, ok := citizenID(w, r)
	if !ok {
		return
	}
	input, ok := decodeBody[previewEnvelopeInput](w, r)
	if !ok {
		return
	}

	split, err := h.service.PreviewEnvelope(r.Context(), id, input)
	if err != nil {
		web.WriteError(w, err)
		return
	}
	web.WriteJSON(w, http.StatusOK, split)
}

// GET /op/cycles (público)
func (h *Handler) ListCycles(w http.ResponseWriter, r *http.Request) {
	cycles, err := h.service.ListCycles(r.Context())
	if err != nil {
		web.WriteError(w, err)
		return
	}
	web.WriteJSON(w, http.StatusOK, cycles)
}

// GET /op/cycles/current (público)
func (h *Handler) GetCurrentCycle(w http.ResponseWriter, r *http.Request) {
	cycle, err := h.service.GetCurrentCycle(r.Context())
	if err != nil {
		web.WriteError(w, err)
		return
	}
	web.WriteJSON(w, http.StatusOK, cycle)
}

// GET /op/cycles/{id} (público)
func (h *Handler) GetCycle(w http.ResponseWriter, r *http.Request) {
	cycle, err := h.service.GetCycle(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		web.WriteError(w, err)
		return
	}
	web.WriteJSON(w, http.StatusOK, cycle)
}
