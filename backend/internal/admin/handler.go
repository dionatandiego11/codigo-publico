package admin

import (
	"database/sql"
	"net/http"
	"strings"
	"time"

	"codigo-publico/backend/internal/auth"
	"codigo-publico/backend/internal/web"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Handler struct {
	db *pgxpool.Pool
}

func NewHandler(db *pgxpool.Pool) *Handler {
	return &Handler{db: db}
}

type ContextResponse struct {
	CitizenID               string              `json:"citizenId"`
	FullName                string              `json:"fullName"`
	Role                    string              `json:"role"`
	RoleLabel               string              `json:"roleLabel"`
	Levels                  []string            `json:"levels"`
	CanTechnical            bool                `json:"canTechnical"`
	CanGeneral              bool                `json:"canGeneral"`
	CanTerritorial          bool                `json:"canTerritorial"`
	CanManageAllTerritories bool                `json:"canManageAllTerritories"`
	RegisteredTerritoryID   *string             `json:"registeredTerritoryId,omitempty"`
	RegisteredTerritorySlug *string             `json:"registeredTerritorySlug,omitempty"`
	RegisteredTerritoryName *string             `json:"registeredTerritoryName,omitempty"`
	Maintainers             []MaintainerContext `json:"maintainers"`
}

type MaintainerContext struct {
	ID                string  `json:"id"`
	TerritoryID       string  `json:"territoryId,omitempty"`
	TerritorySlug     string  `json:"territorySlug,omitempty"`
	TerritoryName     string  `json:"territoryName,omitempty"`
	Scope             string  `json:"scope"`
	Status            string  `json:"status"`
	AppointmentSource *string `json:"appointmentSource,omitempty"`
	TermStart         *string `json:"termStart,omitempty"`
	TermEnd           *string `json:"termEnd,omitempty"`
	CreatedAt         string  `json:"createdAt"`
}

// Context devolve a leitura administrativa do cidadão autenticado. O backend
// continua sendo a autoridade final de permissão; este endpoint só orienta a UI.
func (h *Handler) Context(w http.ResponseWriter, r *http.Request) {
	citizenID, ok := auth.CitizenIDFromContext(r.Context())
	if !ok {
		web.WriteErrorMessage(w, http.StatusUnauthorized, "missing authenticated citizen")
		return
	}

	var response ContextResponse
	var territoryID sql.NullString
	var territorySlug sql.NullString
	var territoryName sql.NullString

	err := h.db.QueryRow(r.Context(), `
		SELECT c.id::text, c.full_name, c.role, t.id::text, t.slug, t.name
		FROM citizens c
		LEFT JOIN territories t ON t.id = c.territory_id
		WHERE c.id = $1::uuid
	`, citizenID).Scan(
		&response.CitizenID,
		&response.FullName,
		&response.Role,
		&territoryID,
		&territorySlug,
		&territoryName,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			web.WriteErrorMessage(w, http.StatusNotFound, "citizen not found")
			return
		}
		web.WriteError(w, err)
		return
	}

	response.RoleLabel = roleLabel(response.Role)
	response.RegisteredTerritoryID = nullStringPtr(territoryID)
	response.RegisteredTerritorySlug = nullStringPtr(territorySlug)
	response.RegisteredTerritoryName = nullStringPtr(territoryName)

	maintainers, err := h.listMaintainers(r, citizenID)
	if err != nil {
		web.WriteError(w, err)
		return
	}
	response.Maintainers = maintainers

	hasGeneralMaintainer := false
	hasTerritorialMaintainer := false
	for _, item := range maintainers {
		switch item.Scope {
		case "geral":
			hasGeneralMaintainer = true
		case "territorial":
			hasTerritorialMaintainer = true
		}
	}

	response.CanTechnical = isTechnicalRole(response.Role)
	response.CanGeneral = response.CanTechnical || isLegislativeRole(response.Role) || hasGeneralMaintainer
	response.CanTerritorial = response.CanGeneral || hasTerritorialMaintainer
	response.CanManageAllTerritories = response.CanTechnical || response.CanGeneral
	response.Levels = levels(response.CanTechnical, response.CanGeneral, response.CanTerritorial)

	web.WriteJSON(w, http.StatusOK, response)
}

func (h *Handler) listMaintainers(r *http.Request, citizenID string) ([]MaintainerContext, error) {
	rows, err := h.db.Query(r.Context(), `
		SELECT
			m.id::text,
			COALESCE(m.territory_id::text, ''),
			COALESCE(t.slug, ''),
			COALESCE(t.name, ''),
			m.scope,
			m.status,
			m.appointment_source,
			m.term_start,
			m.term_end,
			m.created_at
		FROM territory_maintainers m
		LEFT JOIN territories t ON t.id = m.territory_id
		WHERE m.citizen_id = $1::uuid
			AND m.status IN ('Provisório', 'Ativo', 'Em revisão')
			AND (m.term_end IS NULL OR m.term_end > NOW())
		ORDER BY m.scope, t.name NULLS LAST, m.created_at DESC
	`, citizenID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make([]MaintainerContext, 0)
	for rows.Next() {
		var item MaintainerContext
		var appointmentSource sql.NullString
		var termStart sql.NullTime
		var termEnd sql.NullTime
		var createdAt time.Time

		if err := rows.Scan(
			&item.ID,
			&item.TerritoryID,
			&item.TerritorySlug,
			&item.TerritoryName,
			&item.Scope,
			&item.Status,
			&appointmentSource,
			&termStart,
			&termEnd,
			&createdAt,
		); err != nil {
			return nil, err
		}

		item.AppointmentSource = nullStringPtr(appointmentSource)
		item.TermStart = nullTimePtr(termStart)
		item.TermEnd = nullTimePtr(termEnd)
		item.CreatedAt = createdAt.UTC().Format(time.RFC3339)
		result = append(result, item)
	}

	return result, rows.Err()
}

func isTechnicalRole(role string) bool {
	switch strings.ToLower(strings.TrimSpace(role)) {
	case "sysadmin", "admin", "institutional_admin":
		return true
	default:
		return false
	}
}

func isLegislativeRole(role string) bool {
	switch strings.ToLower(strings.TrimSpace(role)) {
	case "legislative_admin", "vereador", "mesa_diretora":
		return true
	default:
		return false
	}
}

func roleLabel(role string) string {
	switch strings.ToLower(strings.TrimSpace(role)) {
	case "sysadmin", "admin", "institutional_admin":
		return "Maintainer técnico"
	case "legislative_admin", "vereador", "mesa_diretora":
		return "Maintainer geral"
	case "procurador":
		return "Apoio jurídico"
	case "secretario":
		return "Apoio executivo"
	default:
		return "Cidadão"
	}
}

func levels(canTechnical, canGeneral, canTerritorial bool) []string {
	result := make([]string, 0, 3)
	if canTechnical {
		result = append(result, "technical")
	}
	if canGeneral {
		result = append(result, "general")
	}
	if canTerritorial {
		result = append(result, "territorial")
	}
	return result
}

func nullStringPtr(value sql.NullString) *string {
	if !value.Valid {
		return nil
	}
	return &value.String
}

func nullTimePtr(value sql.NullTime) *string {
	if !value.Valid {
		return nil
	}
	formatted := value.Time.UTC().Format(time.RFC3339)
	return &formatted
}
