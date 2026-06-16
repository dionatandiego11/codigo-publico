// Package territorial implementa a governança territorial do Código Público:
// vínculos cidadão ↔ território-base, níveis de confiança (T0–T4),
// maintainers, recursos ao Maintainer Geral e contestação comunitária.
//
// Regra-síntese: "Uma pessoa, uma cidade, um território-base, um nível de
// confiança" — e nenhuma decisão territorial relevante é irrecorrível.
package territorial

import "strings"

const (
	BondTypeResident = "morador"
	BondTypeWorker   = "trabalhador"
	BondTypeStudent  = "estudante"
)

const (
	BondStatusPending   = "Pendente"
	BondStatusApproved  = "Aprovado"
	BondStatusRejected  = "Recusado"
	BondStatusContested = "Contestado"
	BondStatusRevoked   = "Revogado"
)

const (
	AppealStatusPending = "Pendente"
	AppealStatusGranted = "Deferido"
	AppealStatusDenied  = "Indeferido"
)

const (
	ContestationStatusOpen      = "Aberta"
	ContestationStatusUpheld    = "Mantido"
	ContestationStatusRevoked   = "Revogado"
	ContestationStatusEscalated = "Escalada"
)

// Bond é o vínculo territorial exposto pela API.
type Bond struct {
	ID             string  `json:"id"`
	CitizenID      string  `json:"citizenId"`
	CitizenName    string  `json:"citizenName"`
	TerritoryID    string  `json:"territoryId"`
	TerritorySlug  string  `json:"territorySlug"`
	TerritoryName  string  `json:"territoryName"`
	BondType       string  `json:"bondType"`
	TrustLevel     string  `json:"trustLevel"`
	Status         string  `json:"status"`
	EvidenceNote   *string `json:"evidenceNote,omitempty"`
	DecisionReason *string `json:"decisionReason,omitempty"`
	DecidedAt      *string `json:"decidedAt,omitempty"`
	CreatedAt      string  `json:"createdAt"`
}

type Appeal struct {
	ID             string  `json:"id"`
	BondID         string  `json:"bondId"`
	Reason         string  `json:"reason"`
	Status         string  `json:"status"`
	DecisionReason *string `json:"decisionReason,omitempty"`
	DecidedAt      *string `json:"decidedAt,omitempty"`
	CreatedAt      string  `json:"createdAt"`
}

type Contestation struct {
	ID             string  `json:"id"`
	BondID         string  `json:"bondId"`
	Reason         string  `json:"reason"`
	Defense        *string `json:"defense,omitempty"`
	Status         string  `json:"status"`
	DecisionReason *string `json:"decisionReason,omitempty"`
	DecidedAt      *string `json:"decidedAt,omitempty"`
	CreatedAt      string  `json:"createdAt"`
}

// GovernanceSummary é o retrato público da governança de um território.
type GovernanceSummary struct {
	TerritoryID         string `json:"territoryId"`
	TerritoryName       string `json:"territoryName"`
	HasActiveMaintainer bool   `json:"hasActiveMaintainer"`
	AcceptsNewBonds     bool   `json:"acceptsNewBonds"`
	ActiveMaintainers   int    `json:"activeMaintainers"`
	ApprovedBondsCount  int    `json:"approvedBondsCount"`
	PendingBondsCount   int    `json:"pendingBondsCount"`
	ContestedBondsCount int    `json:"contestedBondsCount"`
}

type actor struct {
	ID   string
	Name string
	Role string
}

// ── Requests ──────────────────────────────────────────────────────────────────

type requestBondInput struct {
	BondType     string `json:"bondType"`
	EvidenceNote string `json:"evidenceNote"`
}

type decideBondInput struct {
	Approve    bool   `json:"approve"`
	TrustLevel string `json:"trustLevel"`
	Reason     string `json:"reason"`
}

type appealInput struct {
	Reason string `json:"reason"`
}

type decideAppealInput struct {
	Uphold bool   `json:"uphold"`
	Reason string `json:"reason"`
}

type contestInput struct {
	Reason     string `json:"reason"`
	HasNewFact bool   `json:"hasNewFact"`
}

type defenseInput struct {
	Defense string `json:"defense"`
}

type decideContestationInput struct {
	Outcome string `json:"outcome"` // Mantido | Revogado | Escalada
	Reason  string `json:"reason"`
}

// ── Regras de tipo e nível de confiança ───────────────────────────────────────

func isValidBondType(bondType string) bool {
	switch bondType {
	case BondTypeResident, BondTypeWorker, BondTypeStudent:
		return true
	default:
		return false
	}
}

var trustLevelOrder = map[string]int{"T0": 0, "T1": 1, "T2": 2, "T3": 3, "T4": 4}

func isValidTrustLevel(level string) bool {
	_, ok := trustLevelOrder[level]
	return ok
}

// defaultTrustLevel: morador validado entra como T3; quem trabalha ou estuda
// na cidade participa com menos poder deliberativo (T1).
func defaultTrustLevel(bondType string) string {
	if bondType == BondTypeResident {
		return "T3"
	}

	return "T1"
}

// maxTrustLevel limita o teto por tipo de vínculo: morador pode chegar a T4
// (participação qualificada); trabalhador/estudante param em T2.
func maxTrustLevel(bondType string) string {
	if bondType == BondTypeResident {
		return "T4"
	}

	return "T2"
}

func trustLevelExceeds(level, limit string) bool {
	return trustLevelOrder[level] > trustLevelOrder[limit]
}

// isSysadminRole cobre a administração técnica municipal.
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
