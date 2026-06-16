package proposals

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

func (h *Handler) ListProposals(w http.ResponseWriter, r *http.Request) {
	proposals, err := h.service.ListProposals(r.Context())
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusOK, proposals)
}

func (h *Handler) ListProposalsByTerritory(w http.ResponseWriter, r *http.Request) {
	proposals, err := h.service.ListProposalsByTerritory(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusOK, proposals)
}

func (h *Handler) GetProposal(w http.ResponseWriter, r *http.Request) {
	proposal, err := h.service.GetProposal(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusOK, proposal)
}

func (h *Handler) CreateProposalFromDemand(w http.ResponseWriter, r *http.Request) {
	id, ok := citizenID(w, r)
	if !ok {
		return
	}
	input, ok := decodeBody[createProposalInput](w, r)
	if !ok {
		return
	}

	proposal, err := h.service.CreateProposalFromDemand(r.Context(), id, chi.URLParam(r, "id"), input)
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusCreated, proposal)
}
