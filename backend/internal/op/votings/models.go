package votings

type actor struct {
	ID          string
	Name        string
	Role        string
	TerritoryID string
}

type proposalRecord struct {
	ID             string
	PublicID       string
	CycleID        string
	CyclePhase     string
	TerritoryID    string
	Title          string
	ProblemSummary string
	SolutionScope  string
	Status         string
	DemandID       string
}

type Voting struct {
	ID            string `json:"id"`
	CycleID       string `json:"cycleId"`
	ProposalID    string `json:"proposalId"`
	TerritoryID   string `json:"territoryId"`
	TerritoryName string `json:"territoryName"`
	Title         string `json:"title"`
	Summary       string `json:"summary"`
	Scope         string `json:"scope"`
	Deadline      string `json:"deadline"`
	QuorumNeeded  int    `json:"quorumNeeded"`
	QuorumReached int    `json:"quorumReached"`
	VotesYes      int    `json:"votesYes"`
	VotesNo       int    `json:"votesNo"`
	VotesAbstain  int    `json:"votesAbstain"`
	Status        string `json:"status"`
	CreatedAt     string `json:"createdAt"`
	UpdatedAt     string `json:"updatedAt"`
}

type Results struct {
	ID              string  `json:"id"`
	Title           string  `json:"title"`
	Status          string  `json:"status"`
	Deadline        string  `json:"deadline"`
	QuorumNeeded    int     `json:"quorumNeeded"`
	QuorumReached   int     `json:"quorumReached"`
	QuorumPercent   float64 `json:"quorumPercent"`
	TotalVotes      int     `json:"totalVotes"`
	VotesYes        int     `json:"votesYes"`
	VotesNo         int     `json:"votesNo"`
	VotesAbstain    int     `json:"votesAbstain"`
	YesPercent      float64 `json:"yesPercent"`
	NoPercent       float64 `json:"noPercent"`
	AbstainPercent  float64 `json:"abstainPercent"`
	ApprovalPercent float64 `json:"approvalPercent"`
}

type voteRequest struct {
	Selection string `json:"selection"`
	Vote      string `json:"vote"`
}

type voteResponse struct {
	ReceiptCode string  `json:"receiptCode"`
	Voting      Voting  `json:"voting"`
	Results     Results `json:"results"`
}
