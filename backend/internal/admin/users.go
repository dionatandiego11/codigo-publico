package admin

import (
	"encoding/json"
	"net/http"

	"codigo-publico/backend/internal/web"
	"github.com/go-chi/chi/v5"
	"golang.org/x/crypto/bcrypt"
)

type UserContext struct {
	ID          string `json:"id"`
	PublicID    string `json:"publicId"`
	FullName    string `json:"fullName"`
	Role        string `json:"role"`
	RoleLabel   string `json:"roleLabel"`
	TerritoryID string `json:"territoryId,omitempty"`
	CreatedAt   string `json:"createdAt"`
}

type CreateUserInput struct {
	FullName string `json:"fullName"`
	CPF      string `json:"cpf"`
	Role     string `json:"role"`
}

type UpdateUserRoleInput struct {
	Role string `json:"role"`
}

func (h *Handler) ListUsers(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(r.Context(), `
		SELECT id::text, public_id, full_name, COALESCE(role, 'citizen'), COALESCE(territory_id::text, ''), created_at
		FROM citizens
		ORDER BY created_at DESC
		LIMIT 100
	`)
	if err != nil {
		web.WriteError(w, err)
		return
	}
	defer rows.Close()

	var users []UserContext
	for rows.Next() {
		var u UserContext
		var t string
		if err := rows.Scan(&u.ID, &u.PublicID, &u.FullName, &u.Role, &t, &u.CreatedAt); err != nil {
			web.WriteError(w, err)
			return
		}
		if t != "" {
			u.TerritoryID = t
		}
		u.RoleLabel = roleLabel(u.Role)
		users = append(users, u)
	}

	web.WriteJSON(w, http.StatusOK, users)
}

func (h *Handler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var input CreateUserInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		web.WriteErrorMessage(w, http.StatusBadRequest, "invalid JSON")
		return
	}

	defaultPassword := "codigo123"
	hash, err := bcrypt.GenerateFromPassword([]byte(defaultPassword), bcrypt.DefaultCost)
	if err != nil {
		web.WriteError(w, err)
		return
	}

	role := "citizen"
	if input.Role != "" {
		role = input.Role
	}

	var publicID string
	err = h.db.QueryRow(r.Context(), `
		INSERT INTO citizens (full_name, cpf, role, password_hash)
		VALUES ($1, $2, $3, $4)
		RETURNING public_id
	`, input.FullName, input.CPF, role, string(hash)).Scan(&publicID)
	
	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusCreated, map[string]string{
		"publicId": publicID,
		"message":  "Usuário criado com sucesso. Senha padrão: " + defaultPassword,
	})
}

func (h *Handler) UpdateUserRole(w http.ResponseWriter, r *http.Request) {
	userID := chi.URLParam(r, "id")
	var input UpdateUserRoleInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		web.WriteErrorMessage(w, http.StatusBadRequest, "invalid JSON")
		return
	}

	_, err := h.db.Exec(r.Context(), `
		UPDATE citizens
		SET role = $1, updated_at = NOW()
		WHERE id = $2::uuid
	`, input.Role, userID)

	if err != nil {
		web.WriteError(w, err)
		return
	}

	web.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
