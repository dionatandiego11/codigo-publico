package publicapi

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

func (h *Handler) ListVotings(w http.ResponseWriter, r *http.Request) {
	votings, err := h.service.ListVotings(r.Context())
	if err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, votings)
}

func (h *Handler) GetVoting(w http.ResponseWriter, r *http.Request) {
	voting, err := h.service.GetVoting(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, voting)
}

func (h *Handler) CastVote(w http.ResponseWriter, r *http.Request) {
	var input voteRequest
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeErrorMessage(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	response, err := h.service.CastVote(r.Context(), chi.URLParam(r, "id"), input)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, response)
}

func (h *Handler) GetVotingResults(w http.ResponseWriter, r *http.Request) {
	results, err := h.service.GetVotingResults(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, results)
}

// CloseExpiredVotings é o gatilho manual (admin) do encerramento por prazo.
func (h *Handler) CloseExpiredVotings(w http.ResponseWriter, r *http.Request) {
	closed, err := h.service.CloseExpiredVotingsByAdmin(r.Context())
	if err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, map[string]int{"closed": closed})
}

// CloseExpiredVotingsSystem é usado pelo job em background (sem HTTP).
func (h *Handler) CloseExpiredVotingsSystem(ctx context.Context) (int, error) {
	return h.service.CloseExpiredVotings(ctx)
}
