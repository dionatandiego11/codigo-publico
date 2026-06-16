package op

import (
	"strings"
	"time"
)

// actor é a visão interna do cidadão que age (sem dados de exibição supérfluos).
type actor struct {
	ID   string
	Name string
	Role string
}

// isSysadminRole espelha a regra do módulo territorial: papéis administrativos
// têm a autoridade institucional de bootstrap.
func isSysadminRole(role string) bool {
	switch strings.ToLower(strings.TrimSpace(role)) {
	case "sysadmin", "admin", "institutional_admin":
		return true
	default:
		return false
	}
}

// isLegislativeRole cobre a instância geral do OP: Legislativo municipal.
func isLegislativeRole(role string) bool {
	switch strings.ToLower(strings.TrimSpace(role)) {
	case "legislative_admin", "vereador", "mesa_diretora":
		return true
	default:
		return false
	}
}

// Cycle é a visão pública de um ciclo do OP. O calendário é derivado das janelas
// do regimento (não persistido) e só aparece quando há data de início.
type Cycle struct {
	ID            string         `json:"id"`
	Label         string         `json:"label"`
	Phase         string         `json:"phase"`
	Regimento     RegimentoLocal `json:"regimento"`
	EnvelopeTotal int64          `json:"envelopeTotal"`
	StartsAt      *string        `json:"startsAt"`
	LOADeadline   *string        `json:"loaDeadline"`
	Calendar      *Calendar      `json:"calendar,omitempty"`
	CreatedAt     string         `json:"createdAt"`
	UpdatedAt     string         `json:"updatedAt"`
}

// ── Requests ──────────────────────────────────────────────────────────────────

type createCycleInput struct {
	Label         string          `json:"label"`
	Regimento     *RegimentoLocal `json:"regimento"` // opcional → DefaultRegimento
	EnvelopeTotal int64           `json:"envelopeTotal"`
	StartsAt      *time.Time      `json:"startsAt"`
	LOADeadline   *time.Time      `json:"loaDeadline"`
}

type configureCycleInput struct {
	Label         string          `json:"label"`
	Regimento     *RegimentoLocal `json:"regimento"`
	EnvelopeTotal int64           `json:"envelopeTotal"`
	StartsAt      *time.Time      `json:"startsAt"`
	LOADeadline   *time.Time      `json:"loaDeadline"`
}

type advanceCycleInput struct {
	To string `json:"to"` // próxima fase esperada (confirmação opcional)
}

type cancelCycleInput struct {
	Reason string `json:"reason"`
}

type previewEnvelopeInput struct {
	Total       int64             `json:"total"`
	Regimento   *RegimentoLocal   `json:"regimento"` // opcional → DefaultRegimento
	Territories []TerritoryWeight `json:"territories"`
}
