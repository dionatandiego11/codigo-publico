package publicapi

import "database/sql"

type ArticleComment struct {
	ID         string `json:"id"`
	AuthorName string `json:"authorName"`
	AuthorRole string `json:"authorRole"`
	Content    string `json:"content"`
	CreatedAt  string `json:"createdAt"`
	Likes      int    `json:"likes"`
}

type LawArticle struct {
	ID                 string           `json:"id"`
	Number             int              `json:"number"`
	Title              string           `json:"title"`
	Content            string           `json:"content"`
	CitizenExplanation string           `json:"citizenExplanation"`
	Chapter            string           `json:"chapter"`
	Section            *string          `json:"section,omitempty"`
	Version            string           `json:"version"`
	LastUpdated        string           `json:"lastUpdated"`
	AmendmentNumber    *string          `json:"amendmentNumber,omitempty"`
	Comments           []ArticleComment `json:"comments"`
}

type IssueComment struct {
	ID         string `json:"id"`
	AuthorName string `json:"authorName"`
	Content    string `json:"content"`
	CreatedAt  string `json:"createdAt"`
}

type Issue struct {
	ID                 string         `json:"id"`
	Title              string         `json:"title"`
	Type               string         `json:"type"`
	Territory          string         `json:"territory"`
	Theme              string         `json:"theme"`
	Description        string         `json:"description"`
	AuthorName         string         `json:"authorName"`
	CreatedAt          string         `json:"createdAt"`
	Status             string         `json:"status"`
	Upvotes            int            `json:"upvotes"`
	Comments           []IssueComment `json:"comments"`
	LinkedPRID         *string        `json:"linkedPRId,omitempty"`
	AssignedDepartment *string        `json:"assignedDepartment,omitempty"`
	RelatedArticleID   *string        `json:"relatedArticleId,omitempty"`
	RelatedRepository  *string        `json:"relatedRepository,omitempty"`
}

type DiffLine struct {
	Type    string `json:"type"`
	Content string `json:"content"`
}

type NormativeDiff struct {
	ArticleNumber int        `json:"articleNumber"`
	TitleRef      string     `json:"titleRef"`
	BeforeText    string     `json:"beforeText"`
	AfterText     string     `json:"afterText"`
	Lines         []DiffLine `json:"lines"`
	Rationale     string     `json:"rationale"`
}

type PRComment struct {
	ID         string `json:"id"`
	AuthorName string `json:"authorName"`
	Content    string `json:"content"`
	CreatedAt  string `json:"createdAt"`
}

type PRReview struct {
	ID           string `json:"id"`
	ReviewerName string `json:"reviewerName"`
	ReviewerRole string `json:"reviewerRole"`
	Status       string `json:"status"`
	Conclusion   string `json:"conclusion"`
	Feedback     string `json:"feedback"`
	CreatedAt    string `json:"createdAt"`
}

type InstitutionalCheck struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Status      string `json:"status"`
	Feedback    string `json:"feedback"`
}

type MergeTimelineItem struct {
	Title       string `json:"title"`
	Date        string `json:"date"`
	Completed   bool   `json:"completed"`
	Description string `json:"description"`
}

type CivicPR struct {
	ID               string               `json:"id"`
	Title            string               `json:"title"`
	Repository       string               `json:"repository"`
	TargetTitle      string               `json:"targetTitle"`
	AffectedArticles string               `json:"affectedArticles"`
	AuthorName       string               `json:"authorName"`
	AuthorType       string               `json:"authorType"`
	Status           string               `json:"status"`
	CitizenSummary   string               `json:"citizenSummary"`
	Justification    string               `json:"justification"`
	Diffs            []NormativeDiff      `json:"diffs"`
	LinkedIssueIDs   []string             `json:"linkedIssueIds"`
	Upvotes          int                  `json:"upvotes"`
	Comments         []PRComment          `json:"comments"`
	Reviews          []PRReview           `json:"reviews"`
	Checks           []InstitutionalCheck `json:"checks"`
	VotingID         *string              `json:"votingId,omitempty"`
	CreatedAt        string               `json:"createdAt"`
	MergeTimeline    []MergeTimelineItem  `json:"mergeTimeline"`
}

type Territory struct {
	ID                     string `json:"id"`
	Name                   string `json:"name"`
	Zone                   string `json:"zone"`
	ActiveIssuesCount      int    `json:"activeIssuesCount"`
	LinkedPRsCount         int    `json:"linkedPRsCount"`
	ActiveVotingsCount     int    `json:"activeVotingsCount"`
	ExecutionProjectsCount int    `json:"executionProjectsCount"`
	ActiveCitizensCount    int    `json:"activeCitizensCount"`
}

type Release struct {
	ID                    string   `json:"id"`
	Title                 string   `json:"title"`
	Date                  string   `json:"date"`
	RepositoryName        string   `json:"repositoryName"`
	Changelog             []string `json:"changelog"`
	IncorporatedPRIDs     []string `json:"incorporatedPRIds"`
	AffectedArticlesCount int      `json:"affectedArticlesCount"`
	OfficialDocumentURL   *string  `json:"officialDocumentUrl,omitempty"`
	PromulgatedBy         string   `json:"promulgatedBy"`
}

type ExecutionEvidence struct {
	Title string `json:"title"`
	Date  string `json:"date"`
	URL   string `json:"url"`
}

type ExecutionUpdate struct {
	ID          string `json:"id"`
	Date        string `json:"date"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Category    string `json:"category"`
}

type ExecutionTracker struct {
	ID                    string              `json:"id"`
	Title                 string              `json:"title"`
	OriginalPRID          *string             `json:"originalPRId,omitempty"`
	NormReference         string              `json:"normReference"`
	ResponsibleDepartment string              `json:"responsibleDepartment"`
	Deadline              *string             `json:"deadline,omitempty"`
	Status                string              `json:"status"`
	ProgressPercentage    int                 `json:"progressPercentage"`
	BudgetAllocated       string              `json:"budgetAllocated"`
	BudgetSpent           string              `json:"budgetSpent"`
	Evidence              []ExecutionEvidence `json:"evidence"`
	Updates               []ExecutionUpdate   `json:"updates"`
}

type PublicStats struct {
	TotalCitizens          int    `json:"totalCitizens"`
	OrganicLawArticles     int    `json:"organicLawArticles"`
	OpenIssuesCount        int    `json:"openIssuesCount"`
	PRsInReviewCount       int    `json:"prsInReviewCount"`
	ActiveVotingsCount     int    `json:"activeVotingsCount"`
	ReleasesCount          int    `json:"releasesCount"`
	CivicParticipationRate string `json:"civicParticipationRate"`
}

type Voting struct {
	ID              string   `json:"id"`
	Title           string   `json:"title"`
	CitizenSummary  string   `json:"citizenSummary"`
	TextChanges     string   `json:"textChanges"`
	IntendedImpact  string   `json:"intendedImpact"`
	Pros            []string `json:"pros"`
	Cons            []string `json:"cons"`
	ReviewsOverview string   `json:"reviewsOverview"`
	Deadline        string   `json:"deadline"`
	QuorumNeeded    int      `json:"quorumNeeded"`
	QuorumReached   int      `json:"quorumReached"`
	VotesYes        int      `json:"votesYes"`
	VotesNo         int      `json:"votesNo"`
	VotesAbstain    int      `json:"votesAbstain"`
	Status          string   `json:"status"`
}

type VotingResults struct {
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
	ReceiptCode string        `json:"receiptCode"`
	Voting      Voting        `json:"voting"`
	Results     VotingResults `json:"results"`
}

type mergePRRequest struct {
	Version                 *string `json:"version"`
	ReleaseTitle            *string `json:"releaseTitle"`
	ReleaseDate             *string `json:"releaseDate"`
	OfficialDocumentURL     *string `json:"officialDocumentUrl"`
	PromulgatedBy           string  `json:"promulgatedBy"`
	FormalApprovalReference string  `json:"formalApprovalReference"`
}

type mergedArticle struct {
	ID            string `json:"id"`
	Number        int    `json:"number"`
	Title         string `json:"title"`
	Version       string `json:"version"`
	LastUpdated   string `json:"lastUpdated"`
	AmendmentNote string `json:"amendmentNote"`
}

type mergePRResponse struct {
	PR              CivicPR         `json:"pr"`
	Release         Release         `json:"release"`
	UpdatedArticles []mergedArticle `json:"updatedArticles"`
}

type apiError struct {
	Error string `json:"error"`
}

// PRTransitionInfo representa uma transição possível exposta ao frontend.
type PRTransitionInfo struct {
	Key         string `json:"key"`
	ToStatus    string `json:"toStatus"`
	Trigger     string `json:"trigger"`
	Description string `json:"description"`
}

// PRAllowedTransitionsResponse é retornado pelo endpoint GET /prs/{id}/transitions.
type PRAllowedTransitionsResponse struct {
	CurrentStatus string            `json:"currentStatus"`
	WorkflowStage string            `json:"workflowStage"`
	Terminal      bool              `json:"terminal"`
	Transitions   []PRTransitionInfo `json:"transitions"`
}

type citizenActor struct {
	ID   string
	Name string
	Role string
}

type prMergeIdentity struct {
	InternalID string
	PublicID   string
	Title      string
	Repository string
	Status     string
}

type normativeDiffToMerge struct {
	ID            string
	ArticleID     sql.NullString
	ArticleNumber int
	TitleRef      string
	AfterText     string
}

type createIssueRequest struct {
	Title              string  `json:"title"`
	Type               string  `json:"type"`
	Territory          *string `json:"territory"`
	TerritoryID        *string `json:"territoryId"`
	Theme              string  `json:"theme"`
	Description        string  `json:"description"`
	AssignedDepartment *string `json:"assignedDepartment"`
	RelatedArticleID   *string `json:"relatedArticleId"`
	RelatedRepository  *string `json:"relatedRepository"`
	LinkedPRID         *string `json:"linkedPRId"`
}

type createPRRequest struct {
	Title            string          `json:"title"`
	Repository       string          `json:"repository"`
	TargetTitle      string          `json:"targetTitle"`
	AffectedArticles string          `json:"affectedArticles"`
	AuthorType       string          `json:"authorType"`
	CitizenSummary   string          `json:"citizenSummary"`
	Justification    string          `json:"justification"`
	Diffs            []NormativeDiff `json:"diffs"`
	LinkedIssueIDs   []string        `json:"linkedIssueIds"`
}

type createCommentRequest struct {
	Content string `json:"content"`
}
