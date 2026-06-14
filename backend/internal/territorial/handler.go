package territorial

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

// POST /territories/{id}/bonds
func (h *Handler) RequestBond(w http.ResponseWriter, r *http.Request) {
	id, ok := citizenID(w, r)
	if !ok {
		return
	}

	input, ok := decodeBody[requestBondInput](w, r)
	if !ok {
		return
	}

	bond, err := h.service.RequestBond(r.Context(), id, chi.URLParam(r, "id"), input)
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusCreated, bond)
}

// GET /me/bond
func (h *Handler) MyBond(w http.ResponseWriter, r *http.Request) {
	id, ok := citizenID(w, r)
	if !ok {
		return
	}

	bond, err := h.service.MyBond(r.Context(), id)
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusOK, bond)
}

// GET /territories/{id}/bonds?status=Pendente
func (h *Handler) ListTerritoryBonds(w http.ResponseWriter, r *http.Request) {
	id, ok := citizenID(w, r)
	if !ok {
		return
	}

	bonds, err := h.service.ListTerritoryBonds(r.Context(), id, chi.URLParam(r, "id"), r.URL.Query().Get("status"))
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusOK, bonds)
}

// POST /bonds/{id}/decision
func (h *Handler) DecideBond(w http.ResponseWriter, r *http.Request) {
	id, ok := citizenID(w, r)
	if !ok {
		return
	}

	input, ok := decodeBody[decideBondInput](w, r)
	if !ok {
		return
	}

	bond, err := h.service.DecideBond(r.Context(), id, chi.URLParam(r, "id"), input)
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusOK, bond)
}

// POST /bonds/{id}/appeal
func (h *Handler) AppealBond(w http.ResponseWriter, r *http.Request) {
	id, ok := citizenID(w, r)
	if !ok {
		return
	}

	input, ok := decodeBody[appealInput](w, r)
	if !ok {
		return
	}

	appeal, err := h.service.AppealBond(r.Context(), id, chi.URLParam(r, "id"), input)
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusCreated, appeal)
}

// POST /appeals/{id}/decision
func (h *Handler) DecideAppeal(w http.ResponseWriter, r *http.Request) {
	id, ok := citizenID(w, r)
	if !ok {
		return
	}

	input, ok := decodeBody[decideAppealInput](w, r)
	if !ok {
		return
	}

	bond, err := h.service.DecideAppeal(r.Context(), id, chi.URLParam(r, "id"), input)
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusOK, bond)
}

// POST /bonds/{id}/contest
func (h *Handler) ContestBond(w http.ResponseWriter, r *http.Request) {
	id, ok := citizenID(w, r)
	if !ok {
		return
	}

	input, ok := decodeBody[contestInput](w, r)
	if !ok {
		return
	}

	contestation, err := h.service.ContestBond(r.Context(), id, chi.URLParam(r, "id"), input)
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusCreated, contestation)
}

// POST /contestations/{id}/defense
func (h *Handler) SubmitDefense(w http.ResponseWriter, r *http.Request) {
	id, ok := citizenID(w, r)
	if !ok {
		return
	}

	input, ok := decodeBody[defenseInput](w, r)
	if !ok {
		return
	}

	if err := h.service.SubmitDefense(r.Context(), id, chi.URLParam(r, "id"), input); err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusOK, map[string]string{"status": "defense recorded"})
}

// POST /contestations/{id}/decision
func (h *Handler) DecideContestation(w http.ResponseWriter, r *http.Request) {
	id, ok := citizenID(w, r)
	if !ok {
		return
	}

	input, ok := decodeBody[decideContestationInput](w, r)
	if !ok {
		return
	}

	bond, err := h.service.DecideContestation(r.Context(), id, chi.URLParam(r, "id"), input)
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusOK, bond)
}

// GET /territories/{id}/governance (público)
func (h *Handler) TerritoryGovernance(w http.ResponseWriter, r *http.Request) {
	summary, err := h.service.TerritoryGovernance(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusOK, summary)
}
