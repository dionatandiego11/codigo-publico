package publicapi

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

func (h *Handler) ListPRs(w http.ResponseWriter, r *http.Request) {
	prs, err := h.service.ListPRs(r.Context())
	if err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, prs)
}

func (h *Handler) GetPR(w http.ResponseWriter, r *http.Request) {
	pr, err := h.service.GetPR(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, pr)
}

func (h *Handler) GetPRDiff(w http.ResponseWriter, r *http.Request) {
	diffs, err := h.service.GetPRDiff(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, diffs)
}

func (h *Handler) GetPRReviews(w http.ResponseWriter, r *http.Request) {
	reviews, err := h.service.GetPRReviews(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, reviews)
}

func (h *Handler) GetPRChecks(w http.ResponseWriter, r *http.Request) {
	checks, err := h.service.GetPRChecks(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, checks)
}

// GetPRAllowedTransitions lista as transições de estado que o cidadão autenticado
// pode disparar para o PR informado, com base em seu papel e autoria.
func (h *Handler) GetPRAllowedTransitions(w http.ResponseWriter, r *http.Request) {
	resp, err := h.service.GetPRAllowedTransitions(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, resp)
}
