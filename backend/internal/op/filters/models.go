package filters

// BudgetFilter é o registro público do circuit breaker aplicado a uma demanda.
// Ele explica por que a proposta não avançou e qual caminho de retorno seguir.
type BudgetFilter struct {
	ID                   string  `json:"id"`
	CycleID              string  `json:"cycleId"`
	TerritoryID          string  `json:"territoryId"`
	TerritoryName        string  `json:"territoryName"`
	DemandID             string  `json:"demandId"`
	DemandTitle          string  `json:"demandTitle"`
	ProposalID           *string `json:"proposalId,omitempty"`
	Verdict              string  `json:"verdict"`
	Message              string  `json:"message"`
	ReturnPath           string  `json:"returnPath"`
	EstimatedCostCents   int64   `json:"estimatedCostCents"`
	AvailableCents       int64   `json:"availableCents"`
	ActorName            string  `json:"actorName"`
	ActorRole            string  `json:"actorRole"`
	Status               string  `json:"status"`
	AppealNote           *string `json:"appealNote,omitempty"`
	AppealID             *string `json:"appealId,omitempty"`
	AppealStatus         *string `json:"appealStatus,omitempty"`
	AppealDecisionReason *string `json:"appealDecisionReason,omitempty"`
	AppealDecidedAt      *string `json:"appealDecidedAt,omitempty"`
	CreatedAt            string  `json:"createdAt"`
	UpdatedAt            string  `json:"updatedAt"`
}

type listFiltersInput struct {
	CycleID     string
	TerritoryID string
	DemandID    string
}

type actor struct {
	ID          string
	Name        string
	Role        string
	TerritoryID string
}

type filterRecord struct {
	ID            string
	PublicID      string
	TerritoryID   string
	TerritoryName string
	Status        string
}

type appealRecord struct {
	ID             string
	PublicID       string
	FilterID       string
	FilterPublicID string
	DemandID       string
	Status         string
}

type appealInput struct {
	Reason string `json:"reason"`
}

type decideAppealInput struct {
	Approve bool   `json:"approve"`
	Reason  string `json:"reason"`
}

type BudgetFilterAppeal struct {
	ID             string  `json:"id"`
	FilterID       string  `json:"filterId"`
	TerritoryID    string  `json:"territoryId"`
	TerritoryName  string  `json:"territoryName"`
	CitizenName    string  `json:"citizenName"`
	Reason         string  `json:"reason"`
	Status         string  `json:"status"`
	DecisionReason *string `json:"decisionReason,omitempty"`
	DecidedAt      *string `json:"decidedAt,omitempty"`
	CreatedAt      string  `json:"createdAt"`
}
