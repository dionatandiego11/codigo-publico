package territorial

import (
	"encoding/json"
	"net/http"
	"strings"

	"codigo-publico/backend/internal/web"
	"github.com/go-chi/chi/v5"
)

type CreateTerritoryInput struct {
	Name string `json:"name"`
	Zone string `json:"zone"`
}

type UpdateTerritoryInput struct {
	Name string `json:"name"`
	Zone string `json:"zone"`
}

func slugify(name string) string {
	slug := strings.ToLower(name)
	slug = strings.ReplaceAll(slug, " ", "-")
	return slug
}

// POST /admin/territories
func (h *Handler) CreateTerritory(w http.ResponseWriter, r *http.Request) {
	var input CreateTerritoryInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		web.WriteErrorMessage(w, http.StatusBadRequest, "invalid JSON")
		return
	}

	if input.Name == "" {
		web.WriteErrorMessage(w, http.StatusBadRequest, "name is required")
		return
	}
	if input.Zone == "" {
		input.Zone = "Zona Urbana" // Default fallback
	}

	slug := slugify(input.Name)

	var id string
	err := h.service.repo.db.QueryRow(r.Context(), `
		INSERT INTO territories (slug, name, zone)
		VALUES ($1, $2, $3)
		RETURNING id::text
	`, slug, input.Name, input.Zone).Scan(&id)
	
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusCreated, map[string]string{
		"id":   id,
		"name": input.Name,
		"slug": slug,
		"zone": input.Zone,
	})
}

// PUT /admin/territories/{id}
func (h *Handler) UpdateTerritory(w http.ResponseWriter, r *http.Request) {
	territoryID := chi.URLParam(r, "id")
	var input UpdateTerritoryInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		web.WriteErrorMessage(w, http.StatusBadRequest, "invalid JSON")
		return
	}

	if input.Name == "" {
		web.WriteErrorMessage(w, http.StatusBadRequest, "name is required")
		return
	}
	if input.Zone == "" {
		input.Zone = "Zona Urbana" // Default fallback
	}

	slug := slugify(input.Name)

	_, err := h.service.repo.db.Exec(r.Context(), `
		UPDATE territories
		SET slug = $1, name = $2, zone = $3, updated_at = NOW()
		WHERE id = $4::uuid
	`, slug, input.Name, input.Zone, territoryID)
	
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusOK, map[string]string{
		"id":   territoryID,
		"name": input.Name,
		"slug": slug,
		"zone": input.Zone,
	})
}
