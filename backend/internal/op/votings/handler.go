package votings

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

func (h *Handler) ListVotings(w http.ResponseWriter, r *http.Request) {
	votings, err := h.service.ListVotings(r.Context())
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusOK, votings)
}

func (h *Handler) ListVotingsByTerritory(w http.ResponseWriter, r *http.Request) {
	votings, err := h.service.ListVotingsByTerritory(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusOK, votings)
}

func (h *Handler) GetVoting(w http.ResponseWriter, r *http.Request) {
	voting, err := h.service.GetVoting(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusOK, voting)
}

func (h *Handler) GetResults(w http.ResponseWriter, r *http.Request) {
	results, err := h.service.GetResults(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusOK, results)
}

func (h *Handler) OpenVoting(w http.ResponseWriter, r *http.Request) {
	citizenID, ok := auth.CitizenIDFromContext(r.Context())
	if !ok {
		web.WriteErrorMessage(w, http.StatusUnauthorized, "missing authenticated citizen")
		return
	}

	voting, err := h.service.OpenVoting(r.Context(), citizenID, chi.URLParam(r, "id"))
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusCreated, voting)
}

func (h *Handler) ResolveVoting(w http.ResponseWriter, r *http.Request) {
	citizenID, ok := auth.CitizenIDFromContext(r.Context())
	if !ok {
		web.WriteErrorMessage(w, http.StatusUnauthorized, "missing authenticated citizen")
		return
	}

	voting, err := h.service.ResolveVoting(r.Context(), citizenID, chi.URLParam(r, "id"))
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusOK, voting)
}

func (h *Handler) CastVote(w http.ResponseWriter, r *http.Request) {
	citizenID, ok := auth.CitizenIDFromContext(r.Context())
	if !ok {
		web.WriteErrorMessage(w, http.StatusUnauthorized, "missing authenticated citizen")
		return
	}

	var input voteRequest
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		web.WriteErrorMessage(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	response, err := h.service.CastVote(r.Context(), citizenID, chi.URLParam(r, "id"), input)
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusCreated, response)
}
