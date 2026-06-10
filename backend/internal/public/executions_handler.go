package publicapi

import "net/http"

func (h *Handler) ListExecutions(w http.ResponseWriter, r *http.Request) {
	executions, err := h.service.ListExecutions(r.Context())
	if err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, executions)
}
