package ranking

// RankingItem é a visão pública de um item de ranking do ciclo do OP.
type RankingItem struct {
	ID                string  `json:"id"`
	CycleID           string  `json:"cycleId"`
	TerritoryID       string  `json:"territoryId"`
	TerritoryName     string  `json:"territoryName"`
	DemandID          string  `json:"demandId"`
	ProposalID        string  `json:"proposalId"`
	ProposalTitle     string  `json:"proposalTitle"`
	VotingID          string  `json:"votingId"`
	Position          int     `json:"position"`
	VotesYes          int     `json:"votesYes"`
	VotesNo           int     `json:"votesNo"`
	VotesAbstain      int     `json:"votesAbstain"`
	TotalVotes        int     `json:"totalVotes"`
	ApprovalPct       float64 `json:"approvalPct"`
	QuorumReached     bool    `json:"quorumReached"`
	Approved          bool    `json:"approved"`
	Status            string  `json:"status"`
	FrustrationReason *string `json:"frustrationReason,omitempty"`
	CreatedAt         string  `json:"createdAt"`
	UpdatedAt         string  `json:"updatedAt"`
}

// actor é a visão interna do cidadão que age.
type actor struct {
	ID          string
	Name        string
	Role        string
	TerritoryID string
}

// updateStatusInput é o payload para mudar o status de execução de um item.
type updateStatusInput struct {
	Status string `json:"status"`
	Reason string `json:"reason"`
}

// resolvedVoting carrega os dados necessários para computar o ranking item.
type resolvedVoting struct {
	VotingID       string
	VotingPublicID string
	CycleID        string
	TerritoryID    string
	TerritoryName  string
	ProposalID     string
	ProposalTitle  string
	VotesYes       int
	VotesNo        int
	VotesAbstain   int
	QuorumNeeded   int
	QuorumReached  int
}
