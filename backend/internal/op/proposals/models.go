package proposals

type actor struct {
	ID          string
	Name        string
	Role        string
	TerritoryID string
}

type demandRecord struct {
	ID          string
	PublicID    string
	CycleID     string
	TerritoryID string
	Title       string
	Description string
	Location    string
	Category    string
	Status      string
}

type Proposal struct {
	ID                 string `json:"id"`
	CycleID            string `json:"cycleId"`
	DemandID           string `json:"demandId"`
	TerritoryID        string `json:"territoryId"`
	TerritoryName      string `json:"territoryName"`
	Title              string `json:"title"`
	ProblemSummary     string `json:"problemSummary"`
	SolutionScope      string `json:"solutionScope"`
	EstimatedCostCents int64  `json:"estimatedCostCents"`
	Category           string `json:"category"`
	AuthorName         string `json:"authorName"`
	Status             string `json:"status"`
	CreatedAt          string `json:"createdAt"`
	UpdatedAt          string `json:"updatedAt"`
}

type createProposalInput struct {
	Title              string `json:"title"`
	ProblemSummary     string `json:"problemSummary"`
	SolutionScope      string `json:"solutionScope"`
	EstimatedCostCents int64  `json:"estimatedCostCents"`
	Category           string `json:"category"`
}
