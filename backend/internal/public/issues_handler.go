package publicapi

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

func (h *Handler) ListIssues(w http.ResponseWriter, r *http.Request) {
	issues, err := h.service.ListIssues(r.Context())
	if err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, issues)
}

func (h *Handler) GetIssue(w http.ResponseWriter, r *http.Request) {
	issue, err := h.service.GetIssue(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, issue)
}

func (h *Handler) CreateIssue(w http.ResponseWriter, r *http.Request) {
	var input createIssueRequest
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeErrorMessage(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	issue, err := h.service.CreateIssue(r.Context(), input)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, issue)
}

func (h *Handler) CreateIssueComment(w http.ResponseWriter, r *http.Request) {
	var input createCommentRequest
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeErrorMessage(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	comment, err := h.service.CreateIssueComment(r.Context(), chi.URLParam(r, "id"), input)
	if err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, comment)
}

func (h *Handler) UpvoteIssue(w http.ResponseWriter, r *http.Request) {
	issue, err := h.service.UpvoteIssue(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, issue)
}
