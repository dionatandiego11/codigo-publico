package publicapi

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

func (h *Handler) ListLawArticles(w http.ResponseWriter, r *http.Request) {
	articles, err := h.service.ListLawArticles(r.Context())
	if err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, articles)
}

func (h *Handler) GetLawArticle(w http.ResponseWriter, r *http.Request) {
	article, err := h.service.GetLawArticle(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		writeServiceError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, article)
}
