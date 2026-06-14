package territorial

// Vocabulário e contratos do protocolo de maintainers territoriais.

const (
	MaintainerStatusProvisional = "Provisório"  // mandato curto, em caráter temporário
	MaintainerStatusActive      = "Ativo"        // mandato pleno e vigente
	MaintainerStatusUnderReview = "Em revisão"   // em processo de revisão (recall/recursos)
	MaintainerStatusSuspended   = "Suspenso"     // sem poderes, aguardando decisão
	MaintainerStatusRemoved     = "Destituído"   // removido por processo concluído
	MaintainerStatusExpired     = "Expirado"     // mandato encerrado sem renovação
)

const (
	ScopeTerritorial = "territorial"
	ScopeGeneral     = "geral"
)

const (
	AppointmentElection     = "eleicao_territorial"
	AppointmentLegislative  = "indicacao_legislativa"
	AppointmentExecutive    = "nomeacao_executiva"
	AppointmentEmergency    = "designacao_emergencial"
)

const (
	RecallStatusOpen      = "Aberta"
	RecallStatusApproved  = "Aprovada"
	RecallStatusRejected  = "Rejeitada"
	RecallStatusCancelled = "Cancelada"
)

// Maintainer exposto pela API.
type Maintainer struct {
	ID                string  `json:"id"`
	TerritoryID       string  `json:"territoryId"`
	TerritoryName     string  `json:"territoryName"`
	CitizenID         string  `json:"citizenId"`
	CitizenName       string  `json:"citizenName"`
	Scope             string  `json:"scope"`
	Status            string  `json:"status"`
	AppointmentSource *string `json:"appointmentSource,omitempty"`
	TermStart         *string `json:"termStart,omitempty"`
	TermEnd           *string `json:"termEnd,omitempty"`
	MandateNote       *string `json:"mandateNote,omitempty"`
	CreatedAt         string  `json:"createdAt"`
}

type RecallMotion struct {
	ID             string `json:"id"`
	MaintainerID   string `json:"maintainerId"`
	TerritoryID    string `json:"territoryId"`
	Reason         string `json:"reason"`
	Status         string `json:"status"`
	QuorumRequired int    `json:"quorumRequired"`
	Signatures     int    `json:"signatures"`
	CreatedAt      string `json:"createdAt"`
}

// ── Requests ──────────────────────────────────────────────────────────────────

type appointMaintainerInput struct {
	CitizenID         string `json:"citizenId"`
	Scope             string `json:"scope"`             // territorial | geral
	AppointmentSource string `json:"appointmentSource"` // ver constantes
	MandateNote       string `json:"mandateNote"`
}

type renewMandateInput struct {
	Reason string `json:"reason"`
}

type removeMaintainerInput struct {
	Reason string `json:"reason"`
}

type openRecallInput struct {
	Reason string `json:"reason"`
}
