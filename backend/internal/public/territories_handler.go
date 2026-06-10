package publicapi

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

func (h *Handler) ListTerritories(w http.ResponseWriter, r *http.Request) {
	territories, err := h.service.ListTerritories(r.Context())
	if err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, territories)
}

func (h *Handler) GetTerritory(w http.ResponseWriter, r *http.Request) {
	territory, err := h.service.GetTerritory(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, territory)
}
