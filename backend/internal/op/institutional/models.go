package institutional

// Vocabulário de status de proposta tocado pelo filtro institucional. (A
// centralização do vocabulário de proposta entre subpacotes é dívida conhecida.)
const (
	statusPrioritized = "Priorizada"
	statusInMatrix    = "Incluída na matriz"
	statusReturned    = "Retornada para maturação"
	statusArchived    = "Arquivada"
)

type actor struct {
	ID   string
	Name string
	Role string
}

// proposalReview é a visão mínima de uma proposta para a decisão institucional.
type proposalReview struct {
	ID          string
	PublicID    string
	CycleID     string
	TerritoryID string
	Title       string
	Status      string
}

type institutionalDecisionInput struct {
	Approve bool   `json:"approve"`
	Ground  string `json:"ground"` // fundamento formal (apenas em recusa)
	Reason  string `json:"reason"`
}

// DecisionResult é a resposta da decisão institucional sobre a proposta.
type DecisionResult struct {
	ProposalID     string  `json:"proposalId"`
	ProposalStatus string  `json:"proposalStatus"`
	Outcome        string  `json:"outcome"`
	IncidentID     *string `json:"incidentId,omitempty"`
	Message        string  `json:"message"`
}

// Incident é o registro público de um veto político sobre decisão popular.
type Incident struct {
	ID            string `json:"id"`
	ProposalID    string `json:"proposalId"`
	ProposalTitle string `json:"proposalTitle"`
	TerritoryName string `json:"territoryName"`
	Reason        string `json:"reason"`
	DecidedByName string `json:"decidedByName"`
	DecidedByRole string `json:"decidedByRole"`
	CreatedAt     string `json:"createdAt"`
}
