package publicapi

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

func (h *Handler) CreatePR(w http.ResponseWriter, r *http.Request) {
	var input createPRRequest
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeErrorMessage(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	pr, err := h.service.CreatePR(r.Context(), input)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, pr)
}

func (h *Handler) CreatePRComment(w http.ResponseWriter, r *http.Request) {
	var input createCommentRequest
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeErrorMessage(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	comment, err := h.service.CreatePRComment(r.Context(), chi.URLParam(r, "id"), input)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, comment)
}

func (h *Handler) UpvotePR(w http.ResponseWriter, r *http.Request) {
	pr, err := h.service.UpvotePR(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, pr)
}
