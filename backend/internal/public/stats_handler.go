package publicapi

import "net/http"

func (h *Handler) GetPublicStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.service.GetPublicStats(r.Context())
	if err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, stats)
}
