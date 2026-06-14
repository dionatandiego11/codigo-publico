package territorial

import (
	"net/http"

	"codigo-publico/backend/internal/web"

	"github.com/go-chi/chi/v5"
)

// POST /territories/{id}/maintainers  (nomear; escopo territorial usa o {id})
func (h *Handler) AppointMaintainer(w http.ResponseWriter, r *http.Request) {
	id, ok := citizenID(w, r)
	if !ok {
		return
	}
	input, ok := decodeBody[appointMaintainerInput](w, r)
	if !ok {
		return
	}

	maintainer, err := h.service.AppointMaintainer(r.Context(), id, chi.URLParam(r, "id"), input)
	if err != nil {
		web.WriteError(w, err)
		return
	}
	web.WriteJSON(w, http.StatusCreated, maintainer)
}

// GET /territories/{id}/maintainers
func (h *Handler) ListMaintainers(w http.ResponseWriter, r *http.Request) {
	id, ok := citizenID(w, r)
	if !ok {
		return
	}

	list, err := h.service.ListMaintainers(r.Context(), id, chi.URLParam(r, "id"))
	if err != nil {
		web.WriteError(w, err)
		return
	}
	web.WriteJSON(w, http.StatusOK, list)
}

// POST /maintainers/{id}/activate
func (h *Handler) ActivateMaintainer(w http.ResponseWriter, r *http.Request) {
	id, ok := citizenID(w, r)
	if !ok {
		return
	}

	maintainer, err := h.service.ActivateMaintainer(r.Context(), id, chi.URLParam(r, "id"))
	if err != nil {
		web.WriteError(w, err)
		return
	}
	web.WriteJSON(w, http.StatusOK, maintainer)
}

// POST /maintainers/{id}/renew
func (h *Handler) RenewMandate(w http.ResponseWriter, r *http.Request) {
	id, ok := citizenID(w, r)
	if !ok {
		return
	}
	input, ok := decodeBody[renewMandateInput](w, r)
	if !ok {
		return
	}

	maintainer, err := h.service.RenewMandate(r.Context(), id, chi.URLParam(r, "id"), input)
	if err != nil {
		web.WriteError(w, err)
		return
	}
	web.WriteJSON(w, http.StatusOK, maintainer)
}

// POST /maintainers/{id}/remove
func (h *Handler) RemoveMaintainer(w http.ResponseWriter, r *http.Request) {
	id, ok := citizenID(w, r)
	if !ok {
		return
	}
	input, ok := decodeBody[removeMaintainerInput](w, r)
	if !ok {
		return
	}

	maintainer, err := h.service.RemoveMaintainer(r.Context(), id, chi.URLParam(r, "id"), input)
	if err != nil {
		web.WriteError(w, err)
		return
	}
	web.WriteJSON(w, http.StatusOK, maintainer)
}

// POST /maintainers/{id}/recall
func (h *Handler) OpenRecall(w http.ResponseWriter, r *http.Request) {
	id, ok := citizenID(w, r)
	if !ok {
		return
	}
	input, ok := decodeBody[openRecallInput](w, r)
	if !ok {
		return
	}

	motion, err := h.service.OpenRecall(r.Context(), id, chi.URLParam(r, "id"), input)
	if err != nil {
		web.WriteError(w, err)
		return
	}
	web.WriteJSON(w, http.StatusCreated, motion)
}

// POST /recalls/{id}/sign
func (h *Handler) SignRecall(w http.ResponseWriter, r *http.Request) {
	id, ok := citizenID(w, r)
	if !ok {
		return
	}

	motion, err := h.service.SignRecall(r.Context(), id, chi.URLParam(r, "id"))
	if err != nil {
		web.WriteError(w, err)
		return
	}
	web.WriteJSON(w, http.StatusOK, motion)
}
