package auth

import (
	"database/sql"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

const minPasswordLength = 8

type Handler struct {
	db            *pgxpool.Pool
	jwtSecret     string
	cpfHashSecret string
	jwtTTL        time.Duration
}

func NewHandler(db *pgxpool.Pool, jwtSecret, cpfHashSecret string, jwtTTL time.Duration) *Handler {
	return &Handler{
		db:            db,
		jwtSecret:     jwtSecret,
		cpfHashSecret: cpfHashSecret,
		jwtTTL:        jwtTTL,
	}
}

type RegisterRequest struct {
	FullName    string  `json:"fullName"`
	CPF         string  `json:"cpf"`
	BirthDate   string  `json:"birthDate"`
	Password    string  `json:"password"`
	Phone       *string `json:"phone"`
	Email       *string `json:"email"`
	TerritoryID *string `json:"territoryId"`
}

type LoginRequest struct {
	CPF       string `json:"cpf"`
	BirthDate string `json:"birthDate"`
	Password  string `json:"password"`
}

type CitizenResponse struct {
	ID            string  `json:"id"`
	FullName      string  `json:"fullName"`
	BirthDate     string  `json:"birthDate"`
	Phone         *string `json:"phone,omitempty"`
	Email         *string `json:"email,omitempty"`
	TerritoryID   *string `json:"territoryId,omitempty"`
	TerritoryName *string `json:"territoryName,omitempty"`
	Role          string  `json:"role"`
	CreatedAt     string  `json:"createdAt"`
	UpdatedAt     string  `json:"updatedAt"`
}

type AuthResponse struct {
	Token   string          `json:"token"`
	Citizen CitizenResponse `json:"citizen"`
}

type errorResponse struct {
	Error string `json:"error"`
}

func (h *Handler) RegisterCitizen(w http.ResponseWriter, r *http.Request) {
	var input RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeAuthError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	input.FullName = strings.TrimSpace(input.FullName)
	normalizedCPF := NormalizeCPF(input.CPF)
	birthDate, err := parseBirthDate(input.BirthDate)
	if err != nil {
		writeAuthError(w, http.StatusBadRequest, "birthDate must use YYYY-MM-DD")
		return
	}

	if input.FullName == "" {
		writeAuthError(w, http.StatusBadRequest, "fullName is required")
		return
	}

	if len(normalizedCPF) != 11 {
		writeAuthError(w, http.StatusBadRequest, "cpf must contain 11 digits")
		return
	}

	territoryUUID, err := h.resolveTerritoryID(r, input.TerritoryID)
	if err != nil {
		writeAuthError(w, http.StatusBadRequest, "territoryId was not found")
		return
	}

	// Senha é opcional para compatibilidade com contas legadas; quando
	// enviada, vira o fator de login obrigatório.
	var passwordHash any
	if input.Password != "" {
		if len(input.Password) < minPasswordLength {
			writeAuthError(w, http.StatusBadRequest, "password must have at least 8 characters")
			return
		}

		hashed, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
		if err != nil {
			writeAuthError(w, http.StatusInternalServerError, "failed to secure password")
			return
		}

		passwordHash = string(hashed)
	}

	cpfHash := HashCPF(normalizedCPF, h.cpfHashSecret)

	row := h.db.QueryRow(r.Context(), `
		WITH inserted AS (
			INSERT INTO citizens (
				full_name,
				cpf_hash,
				birth_date,
				password_hash,
				phone,
				email,
				territory_id,
				role
			)
			VALUES ($1, $2, $3, $4, $5, $6, $7::uuid, 'citizen')
			RETURNING
				id,
				full_name,
				birth_date,
				phone,
				email,
				territory_id,
				role,
				created_at,
				updated_at
		)
		SELECT
			c.id::text,
			c.full_name,
			c.birth_date,
			c.phone,
			c.email,
			t.slug,
			t.name,
			c.role,
			c.created_at,
			c.updated_at
		FROM inserted c
		LEFT JOIN territories t ON t.id = c.territory_id
	`, input.FullName, cpfHash, birthDate, passwordHash, nullableValue(input.Phone), nullableValue(input.Email), nullableValue(territoryUUID))

	citizen, err := scanCitizen(row)
	if err != nil {
		if isUniqueViolation(err) {
			writeAuthError(w, http.StatusConflict, "citizen already registered")
			return
		}

		log.Printf("register citizen failed: %v", err)
		writeAuthError(w, http.StatusInternalServerError, "failed to register citizen")
		return
	}

	token, err := GenerateToken(h.jwtSecret, citizen.ID, citizen.Role, h.jwtTTL)
	if err != nil {
		writeAuthError(w, http.StatusInternalServerError, "failed to generate token")
		return
	}

	writeAuthJSON(w, http.StatusCreated, AuthResponse{Token: token, Citizen: citizen})
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var input LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeAuthError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	normalizedCPF := NormalizeCPF(input.CPF)
	if len(normalizedCPF) != 11 {
		writeAuthError(w, http.StatusBadRequest, "cpf must contain 11 digits")
		return
	}

	birthDateRaw := strings.TrimSpace(input.BirthDate)
	if input.Password == "" && birthDateRaw == "" {
		writeAuthError(w, http.StatusBadRequest, "password or birthDate is required")
		return
	}

	cpfHash := HashCPF(normalizedCPF, h.cpfHashSecret)

	record, err := h.findCitizenAuthByCPF(r, cpfHash)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeAuthError(w, http.StatusUnauthorized, "invalid credentials")
			return
		}

		log.Printf("login failed: %v", err)
		writeAuthError(w, http.StatusInternalServerError, "failed to login")
		return
	}

	if input.Password != "" {
		// Login por senha (caminho preferencial).
		if !record.passwordHash.Valid {
			writeAuthError(w, http.StatusUnauthorized, "this account has no password yet; login with cpf and birthDate")
			return
		}

		if bcrypt.CompareHashAndPassword([]byte(record.passwordHash.String), []byte(input.Password)) != nil {
			writeAuthError(w, http.StatusUnauthorized, "invalid credentials")
			return
		}
	} else {
		// Fallback legado por data de nascimento — apenas para contas sem senha.
		if record.passwordHash.Valid {
			writeAuthError(w, http.StatusUnauthorized, "this account requires password login")
			return
		}

		birthDate, err := parseBirthDate(birthDateRaw)
		if err != nil {
			writeAuthError(w, http.StatusBadRequest, "birthDate must use YYYY-MM-DD")
			return
		}

		if !record.birthDate.Equal(birthDate) {
			writeAuthError(w, http.StatusUnauthorized, "invalid credentials")
			return
		}
	}

	token, err := GenerateToken(h.jwtSecret, record.citizen.ID, record.citizen.Role, h.jwtTTL)
	if err != nil {
		writeAuthError(w, http.StatusInternalServerError, "failed to generate token")
		return
	}

	writeAuthJSON(w, http.StatusOK, AuthResponse{Token: token, Citizen: record.citizen})
}

func (h *Handler) Me(w http.ResponseWriter, r *http.Request) {
	citizenID, ok := CitizenIDFromContext(r.Context())
	if !ok {
		writeAuthError(w, http.StatusUnauthorized, "missing authenticated citizen")
		return
	}

	citizen, err := h.findCitizenByID(r, citizenID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeAuthError(w, http.StatusUnauthorized, "citizen not found")
			return
		}

		log.Printf("load authenticated citizen failed: %v", err)
		writeAuthError(w, http.StatusInternalServerError, "failed to load citizen")
		return
	}

	writeAuthJSON(w, http.StatusOK, citizen)
}

func (h *Handler) resolveTerritoryID(r *http.Request, territoryID *string) (*string, error) {
	if territoryID == nil || strings.TrimSpace(*territoryID) == "" {
		return nil, nil
	}

	var id string
	err := h.db.QueryRow(r.Context(), `
		SELECT id::text
		FROM territories
		WHERE id::text = $1 OR slug = $1
	`, strings.TrimSpace(*territoryID)).Scan(&id)
	if err != nil {
		return nil, err
	}

	return &id, nil
}

// citizenAuthRecord carrega o cidadão junto com os fatores de autenticação,
// que nunca saem deste pacote.
type citizenAuthRecord struct {
	citizen      CitizenResponse
	passwordHash sql.NullString
	birthDate    time.Time
}

func (h *Handler) findCitizenAuthByCPF(r *http.Request, cpfHash string) (citizenAuthRecord, error) {
	row := h.db.QueryRow(r.Context(), `
		SELECT
			c.id::text,
			c.full_name,
			c.birth_date,
			c.phone,
			c.email,
			t.slug,
			t.name,
			c.role,
			c.created_at,
			c.updated_at,
			c.password_hash
		FROM citizens c
		LEFT JOIN territories t ON t.id = c.territory_id
		WHERE c.cpf_hash = $1
	`, cpfHash)

	var record citizenAuthRecord
	var phone sql.NullString
	var email sql.NullString
	var territoryID sql.NullString
	var territoryName sql.NullString
	var createdAt time.Time
	var updatedAt time.Time

	err := row.Scan(
		&record.citizen.ID,
		&record.citizen.FullName,
		&record.birthDate,
		&phone,
		&email,
		&territoryID,
		&territoryName,
		&record.citizen.Role,
		&createdAt,
		&updatedAt,
		&record.passwordHash,
	)
	if err != nil {
		return citizenAuthRecord{}, err
	}

	record.citizen.BirthDate = record.birthDate.Format("2006-01-02")
	record.citizen.Phone = nullableStringPtr(phone)
	record.citizen.Email = nullableStringPtr(email)
	record.citizen.TerritoryID = nullableStringPtr(territoryID)
	record.citizen.TerritoryName = nullableStringPtr(territoryName)
	record.citizen.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	record.citizen.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)

	return record, nil
}

func (h *Handler) findCitizenByID(r *http.Request, citizenID string) (CitizenResponse, error) {
	row := h.db.QueryRow(r.Context(), citizenSelectSQL()+`
		WHERE c.id = $1::uuid
	`, citizenID)

	return scanCitizen(row)
}

func citizenSelectSQL() string {
	return `
		SELECT
			c.id::text,
			c.full_name,
			c.birth_date,
			c.phone,
			c.email,
			t.slug,
			t.name,
			c.role,
			c.created_at,
			c.updated_at
		FROM citizens c
		LEFT JOIN territories t ON t.id = c.territory_id
	`
}

type scanner interface {
	Scan(dest ...any) error
}

func scanCitizen(row scanner) (CitizenResponse, error) {
	var citizen CitizenResponse
	var birthDate time.Time
	var phone sql.NullString
	var email sql.NullString
	var territoryID sql.NullString
	var territoryName sql.NullString
	var createdAt time.Time
	var updatedAt time.Time

	err := row.Scan(
		&citizen.ID,
		&citizen.FullName,
		&birthDate,
		&phone,
		&email,
		&territoryID,
		&territoryName,
		&citizen.Role,
		&createdAt,
		&updatedAt,
	)
	if err != nil {
		return CitizenResponse{}, err
	}

	citizen.BirthDate = birthDate.Format("2006-01-02")
	citizen.Phone = nullableStringPtr(phone)
	citizen.Email = nullableStringPtr(email)
	citizen.TerritoryID = nullableStringPtr(territoryID)
	citizen.TerritoryName = nullableStringPtr(territoryName)
	citizen.CreatedAt = createdAt.UTC().Format(time.RFC3339)
	citizen.UpdatedAt = updatedAt.UTC().Format(time.RFC3339)

	return citizen, nil
}

func parseBirthDate(value string) (time.Time, error) {
	return time.Parse("2006-01-02", strings.TrimSpace(value))
}

func nullableValue(value *string) any {
	if value == nil {
		return nil
	}

	cleaned := strings.TrimSpace(*value)
	if cleaned == "" {
		return nil
	}

	return cleaned
}

func nullableStringPtr(value sql.NullString) *string {
	if !value.Valid {
		return nil
	}

	return &value.String
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		return pgErr.Code == "23505"
	}

	return false
}

func writeAuthError(w http.ResponseWriter, statusCode int, message string) {
	writeAuthJSON(w, statusCode, errorResponse{Error: message})
}

func writeAuthJSON(w http.ResponseWriter, statusCode int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(payload)
}
