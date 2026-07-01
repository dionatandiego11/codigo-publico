package demands

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

func (h *Handler) ListDemands(w http.ResponseWriter, r *http.Request) {
	demands, err := h.service.ListDemands(r.Context())
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusOK, demands)
}

func (h *Handler) ListDemandsByTerritory(w http.ResponseWriter, r *http.Request) {
	demands, err := h.service.ListDemandsByTerritory(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusOK, demands)
}

func (h *Handler) GetDemand(w http.ResponseWriter, r *http.Request) {
	demand, err := h.service.GetDemand(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusOK, demand)
}

func (h *Handler) CreateDemand(w http.ResponseWriter, r *http.Request) {
	id, ok := citizenID(w, r)
	if !ok {
		return
	}
	input, ok := decodeBody[createDemandInput](w, r)
	if !ok {
		return
	}

	demand, err := h.service.CreateDemand(r.Context(), id, input)
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusCreated, demand)
}

func (h *Handler) SupportDemand(w http.ResponseWriter, r *http.Request) {
	id, ok := citizenID(w, r)
	if !ok {
		return
	}

	demand, err := h.service.SupportDemand(r.Context(), id, chi.URLParam(r, "id"))
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusOK, demand)
}

func (h *Handler) CreateComment(w http.ResponseWriter, r *http.Request) {
	id, ok := citizenID(w, r)
	if !ok {
		return
	}
	input, ok := decodeBody[createCommentInput](w, r)
	if !ok {
		return
	}

	comment, err := h.service.CreateComment(r.Context(), id, chi.URLParam(r, "id"), input)
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusCreated, comment)
}

func (h *Handler) StartMaturation(w http.ResponseWriter, r *http.Request) {
	id, ok := citizenID(w, r)
	if !ok {
		return
	}
	input, ok := decodeBody[transitionInput](w, r)
	if !ok {
		return
	}

	demand, err := h.service.StartMaturation(r.Context(), id, chi.URLParam(r, "id"), input)
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusOK, demand)
}

func (h *Handler) RequestInfo(w http.ResponseWriter, r *http.Request) {
	id, ok := citizenID(w, r)
	if !ok {
		return
	}
	input, ok := decodeBody[transitionInput](w, r)
	if !ok {
		return
	}

	demand, err := h.service.RequestInfo(r.Context(), id, chi.URLParam(r, "id"), input)
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusOK, demand)
}

func (h *Handler) ValidateTerritory(w http.ResponseWriter, r *http.Request) {
	id, ok := citizenID(w, r)
	if !ok {
		return
	}
	input, ok := decodeBody[transitionInput](w, r)
	if !ok {
		return
	}

	demand, err := h.service.ValidateTerritory(r.Context(), id, chi.URLParam(r, "id"), input)
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusOK, demand)
}

func (h *Handler) MarkReady(w http.ResponseWriter, r *http.Request) {
	id, ok := citizenID(w, r)
	if !ok {
		return
	}
	input, ok := decodeBody[transitionInput](w, r)
	if !ok {
		return
	}

	demand, err := h.service.MarkReady(r.Context(), id, chi.URLParam(r, "id"), input)
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusOK, demand)
}

func (h *Handler) GroupDemand(w http.ResponseWriter, r *http.Request) {
	id, ok := citizenID(w, r)
	if !ok {
		return
	}
	input, ok := decodeBody[groupDemandInput](w, r)
	if !ok {
		return
	}

	demand, err := h.service.GroupDemand(r.Context(), id, chi.URLParam(r, "id"), input)
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusOK, demand)
}

func (h *Handler) ForkDemand(w http.ResponseWriter, r *http.Request) {
	id, ok := citizenID(w, r)
	if !ok {
		return
	}
	input, ok := decodeBody[forkDemandInput](w, r)
	if !ok {
		return
	}

	demand, err := h.service.ForkDemand(r.Context(), id, chi.URLParam(r, "id"), input)
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusCreated, demand)
}

func (h *Handler) RejectDemand(w http.ResponseWriter, r *http.Request) {
	id, ok := citizenID(w, r)
	if !ok {
		return
	}
	input, ok := decodeBody[rejectDemandInput](w, r)
	if !ok {
		return
	}

	demand, err := h.service.RejectDemand(r.Context(), id, chi.URLParam(r, "id"), input)
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusOK, demand)
}

func (h *Handler) ApproveDemand(w http.ResponseWriter, r *http.Request) {
	id, ok := citizenID(w, r)
	if !ok {
		return
	}
	input, ok := decodeBody[approveDemandInput](w, r)
	if !ok {
		return
	}

	demand, err := h.service.ApproveDemand(r.Context(), id, chi.URLParam(r, "id"), input)
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusOK, demand)
}
