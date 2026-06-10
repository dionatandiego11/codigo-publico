package publicapi

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

func (h *Handler) ListReleases(w http.ResponseWriter, r *http.Request) {
	releases, err := h.service.ListReleases(r.Context())
	if err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, releases)
}

func (h *Handler) GetRelease(w http.ResponseWriter, r *http.Request) {
	release, err := h.service.GetRelease(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, release)
}
