package publicapi

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"codigo-publico/backend/internal/auth"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Handler struct {
	db *pgxpool.Pool
}

func NewHandler(db *pgxpool.Pool) *Handler {
	return &Handler{db: db}
}

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

type apiError struct {
	Error string `json:"error"`
}

type citizenActor struct {
	ID   string
	Name string
	Role string
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

func (h *Handler) ListTerritories(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(r.Context(), `
		SELECT
			t.slug,
			t.name,
			t.zone,
			COUNT(DISTINCT i.id) FILTER (WHERE i.status NOT IN ('Resolvida', 'Arquivada'))::int AS active_issues_count,
			COUNT(DISTINCT cp.id)::int AS linked_prs_count,
			COUNT(DISTINCT v.id) FILTER (WHERE v.status = 'Aberta')::int AS active_votings_count,
			COUNT(DISTINCT et.id) FILTER (WHERE et.status NOT IN ('Cumprida', 'Suspensa judicialmente'))::int AS execution_projects_count,
			COUNT(DISTINCT c.id)::int AS active_citizens_count
		FROM territories t
		LEFT JOIN issues i ON i.territory_id = t.id
		LEFT JOIN civic_prs cp ON i.public_id = ANY(cp.linked_issue_public_ids)
			OR cp.citizen_summary ILIKE '%' || t.name || '%'
			OR cp.affected_articles ILIKE '%' || t.name || '%'
		LEFT JOIN votings v ON v.civic_pr_id = cp.id
		LEFT JOIN execution_trackers et ON et.original_pr_id = cp.id
		LEFT JOIN citizens c ON c.territory_id = t.id
		GROUP BY t.id, t.slug, t.name, t.zone
		ORDER BY t.name ASC
	`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	defer rows.Close()

	territories := make([]Territory, 0)
	for rows.Next() {
		var territory Territory
		if err := rows.Scan(
			&territory.ID,
			&territory.Name,
			&territory.Zone,
			&territory.ActiveIssuesCount,
			&territory.LinkedPRsCount,
			&territory.ActiveVotingsCount,
			&territory.ExecutionProjectsCount,
			&territory.ActiveCitizensCount,
		); err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}
		territories = append(territories, territory)
	}

	if err := rows.Err(); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	writeJSON(w, http.StatusOK, territories)
}

func (h *Handler) GetTerritory(w http.ResponseWriter, r *http.Request) {
	territory, err := h.findTerritory(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		writeQueryError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, territory)
}

func (h *Handler) ListLawArticles(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(r.Context(), `
		SELECT
			id::text,
			article_number,
			title,
			content,
			citizen_explanation,
			chapter,
			section,
			version,
			last_updated,
			amendment_number
		FROM law_articles
		ORDER BY article_number ASC
	`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	defer rows.Close()

	articles := make([]LawArticle, 0)
	for rows.Next() {
		article, err := scanLawArticle(rows)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}
		articles = append(articles, article)
	}

	if err := rows.Err(); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	writeJSON(w, http.StatusOK, articles)
}

func (h *Handler) GetLawArticle(w http.ResponseWriter, r *http.Request) {
	article, err := h.findLawArticle(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		writeQueryError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, article)
}

func (h *Handler) ListIssues(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(r.Context(), `
		SELECT
			i.id::text,
			i.public_id,
			i.title,
			i.type,
			i.territory_name,
			i.theme,
			i.description,
			i.author_name,
			i.created_at,
			i.status,
			i.upvotes,
			i.assigned_department,
			i.related_repository,
			i.linked_pr_public_id,
			la.article_number
		FROM issues i
		LEFT JOIN law_articles la ON la.id = i.related_article_id
		ORDER BY i.created_at DESC, i.public_id ASC
	`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	defer rows.Close()

	issues := make([]Issue, 0)
	for rows.Next() {
		issue, internalID, err := scanIssueBase(rows)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}

		issue.Comments, err = h.getIssueCommentsByInternalID(r.Context(), internalID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}

		issues = append(issues, issue)
	}

	if err := rows.Err(); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	writeJSON(w, http.StatusOK, issues)
}

func (h *Handler) GetIssue(w http.ResponseWriter, r *http.Request) {
	issue, _, err := h.findIssue(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		writeQueryError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, issue)
}

func (h *Handler) CreateIssue(w http.ResponseWriter, r *http.Request) {
	actor, err := h.authenticatedCitizen(r.Context())
	if err != nil {
		writeAuthOrQueryError(w, err)
		return
	}

	var input createIssueRequest
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeErrorMessage(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	input.Title = strings.TrimSpace(input.Title)
	input.Type = strings.TrimSpace(input.Type)
	input.Theme = strings.TrimSpace(input.Theme)
	input.Description = strings.TrimSpace(input.Description)
	if input.Title == "" || input.Type == "" || input.Theme == "" || input.Description == "" {
		writeErrorMessage(w, http.StatusBadRequest, "title, type, theme and description are required")
		return
	}

	territoryID, territoryName, err := h.resolveIssueTerritory(r.Context(), input.TerritoryID, input.Territory)
	if err != nil {
		writeErrorMessage(w, http.StatusBadRequest, "territory was not found")
		return
	}

	relatedArticleID, err := h.resolveArticleInternalID(r.Context(), input.RelatedArticleID)
	if err != nil {
		writeErrorMessage(w, http.StatusBadRequest, "relatedArticleId was not found")
		return
	}

	tx, err := h.db.Begin(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	defer rollbackTx(r.Context(), tx)

	publicID, err := nextPublicID(r.Context(), tx, "issues")
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	var internalID string
	err = tx.QueryRow(r.Context(), `
		INSERT INTO issues (
			public_id,
			title,
			type,
			territory_id,
			territory_name,
			theme,
			description,
			author_name,
			author_citizen_id,
			status,
			upvotes,
			assigned_department,
			related_article_id,
			related_repository,
			linked_pr_public_id
		)
		VALUES ($1, $2, $3, $4::uuid, $5, $6, $7, $8, $9::uuid, 'Aberta', 1, $10, $11::uuid, $12, $13)
		RETURNING id::text
	`,
		publicID,
		input.Title,
		input.Type,
		nullableString(territoryID),
		territoryName,
		input.Theme,
		input.Description,
		actor.Name,
		actor.ID,
		nullableString(input.AssignedDepartment),
		nullableString(relatedArticleID),
		nullableString(input.RelatedRepository),
		nullableString(input.LinkedPRID),
	).Scan(&internalID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	if _, err := tx.Exec(r.Context(), `
		INSERT INTO issue_upvotes (issue_id, citizen_id)
		VALUES ($1::uuid, $2::uuid)
	`, internalID, actor.ID); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	if err := insertAuditEvent(r.Context(), tx, actor, "issue.created", "issue", internalID, publicID, map[string]any{
		"title": input.Title,
		"type":  input.Type,
	}); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	if err := tx.Commit(r.Context()); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	issue, _, err := h.findIssue(r.Context(), publicID)
	if err != nil {
		writeQueryError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, issue)
}

func (h *Handler) CreateIssueComment(w http.ResponseWriter, r *http.Request) {
	actor, err := h.authenticatedCitizen(r.Context())
	if err != nil {
		writeAuthOrQueryError(w, err)
		return
	}

	var input createCommentRequest
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeErrorMessage(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	input.Content = strings.TrimSpace(input.Content)
	if input.Content == "" {
		writeErrorMessage(w, http.StatusBadRequest, "content is required")
		return
	}

	issueID, publicID, err := h.findIssueIdentity(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		writeQueryError(w, err)
		return
	}

	tx, err := h.db.Begin(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	defer rollbackTx(r.Context(), tx)

	var comment IssueComment
	var createdAt time.Time
	err = tx.QueryRow(r.Context(), `
		INSERT INTO issue_comments (issue_id, citizen_id, author_name, content)
		VALUES ($1::uuid, $2::uuid, $3, $4)
		RETURNING id::text, author_name, content, created_at
	`, issueID, actor.ID, actor.Name, input.Content).Scan(
		&comment.ID,
		&comment.AuthorName,
		&comment.Content,
		&createdAt,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	if err := insertAuditEvent(r.Context(), tx, actor, "issue.comment.created", "issue", issueID, publicID, map[string]any{
		"commentId": comment.ID,
	}); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	if err := tx.Commit(r.Context()); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	comment.CreatedAt = formatDateTime(createdAt)
	writeJSON(w, http.StatusCreated, comment)
}

func (h *Handler) UpvoteIssue(w http.ResponseWriter, r *http.Request) {
	actor, err := h.authenticatedCitizen(r.Context())
	if err != nil {
		writeAuthOrQueryError(w, err)
		return
	}

	issueID, publicID, err := h.findIssueIdentity(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		writeQueryError(w, err)
		return
	}

	tx, err := h.db.Begin(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	defer rollbackTx(r.Context(), tx)

	inserted, err := insertIssueUpvote(r.Context(), tx, issueID, actor.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	if inserted {
		if _, err := tx.Exec(r.Context(), `
			UPDATE issues
			SET upvotes = upvotes + 1
			WHERE id = $1::uuid
		`, issueID); err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}

		if err := insertAuditEvent(r.Context(), tx, actor, "issue.upvoted", "issue", issueID, publicID, nil); err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}
	}

	if err := tx.Commit(r.Context()); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	issue, _, err := h.findIssue(r.Context(), publicID)
	if err != nil {
		writeQueryError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, issue)
}

func (h *Handler) ListPRs(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(r.Context(), `
		SELECT
			cp.id::text,
			cp.public_id,
			cp.title,
			cp.repository,
			cp.target_title,
			cp.affected_articles,
			cp.author_name,
			cp.author_type,
			cp.status,
			cp.citizen_summary,
			cp.justification,
			cp.linked_issue_public_ids,
			cp.upvotes,
			v.public_id,
			cp.created_at
		FROM civic_prs cp
		LEFT JOIN votings v ON v.id = cp.voting_id
		ORDER BY cp.created_at DESC, cp.public_id ASC
	`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	defer rows.Close()

	prs := make([]CivicPR, 0)
	for rows.Next() {
		pr, internalID, err := scanCivicPRBase(rows)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}

		pr.Diffs, err = h.getPRDiffsByInternalID(r.Context(), internalID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}
		pr.Reviews, err = h.getPRReviewsByInternalID(r.Context(), internalID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}
		pr.Checks, err = h.getPRChecksByInternalID(r.Context(), internalID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}
		pr.Comments, err = h.getPRCommentsByInternalID(r.Context(), internalID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}

		prs = append(prs, pr)
	}

	if err := rows.Err(); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	writeJSON(w, http.StatusOK, prs)
}

func (h *Handler) GetPR(w http.ResponseWriter, r *http.Request) {
	pr, internalID, err := h.findCivicPR(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		writeQueryError(w, err)
		return
	}

	pr.Diffs, err = h.getPRDiffsByInternalID(r.Context(), internalID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	pr.Reviews, err = h.getPRReviewsByInternalID(r.Context(), internalID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	pr.Checks, err = h.getPRChecksByInternalID(r.Context(), internalID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	pr.Comments, err = h.getPRCommentsByInternalID(r.Context(), internalID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	writeJSON(w, http.StatusOK, pr)
}

func (h *Handler) CreatePR(w http.ResponseWriter, r *http.Request) {
	actor, err := h.authenticatedCitizen(r.Context())
	if err != nil {
		writeAuthOrQueryError(w, err)
		return
	}

	var input createPRRequest
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeErrorMessage(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	input.Title = strings.TrimSpace(input.Title)
	input.Repository = strings.TrimSpace(input.Repository)
	input.TargetTitle = strings.TrimSpace(input.TargetTitle)
	input.AffectedArticles = strings.TrimSpace(input.AffectedArticles)
	input.AuthorType = strings.TrimSpace(input.AuthorType)
	input.CitizenSummary = strings.TrimSpace(input.CitizenSummary)
	input.Justification = strings.TrimSpace(input.Justification)
	if input.Title == "" || input.Repository == "" || input.CitizenSummary == "" || input.Justification == "" {
		writeErrorMessage(w, http.StatusBadRequest, "title, repository, citizenSummary and justification are required")
		return
	}
	if input.TargetTitle == "" {
		input.TargetTitle = "Geral"
	}
	if input.AffectedArticles == "" {
		input.AffectedArticles = "Artigos diversos"
	}
	if input.AuthorType == "" {
		input.AuthorType = "Iniciativa Popular"
	}
	input.LinkedIssueIDs = cleanStringList(input.LinkedIssueIDs)

	tx, err := h.db.Begin(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	defer rollbackTx(r.Context(), tx)

	publicID, err := nextPublicID(r.Context(), tx, "civic_prs")
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	var internalID string
	err = tx.QueryRow(r.Context(), `
		INSERT INTO civic_prs (
			public_id,
			title,
			repository,
			target_title,
			affected_articles,
			author_name,
			author_citizen_id,
			author_type,
			status,
			citizen_summary,
			justification,
			linked_issue_public_ids,
			upvotes
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7::uuid, $8, 'Aberto para debate', $9, $10, $11, 1)
		RETURNING id::text
	`,
		publicID,
		input.Title,
		input.Repository,
		input.TargetTitle,
		input.AffectedArticles,
		actor.Name,
		actor.ID,
		input.AuthorType,
		input.CitizenSummary,
		input.Justification,
		input.LinkedIssueIDs,
	).Scan(&internalID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	if _, err := tx.Exec(r.Context(), `
		INSERT INTO pr_upvotes (civic_pr_id, citizen_id)
		VALUES ($1::uuid, $2::uuid)
	`, internalID, actor.ID); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	if err := h.insertNormativeDiffs(r.Context(), tx, internalID, input.Diffs); err != nil {
		writeErrorMessage(w, http.StatusBadRequest, err.Error())
		return
	}

	if err := insertAuditEvent(r.Context(), tx, actor, "pr.created", "civic_pr", internalID, publicID, map[string]any{
		"title":      input.Title,
		"repository": input.Repository,
	}); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	if err := tx.Commit(r.Context()); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	pr, internalID, err := h.findCivicPR(r.Context(), publicID)
	if err != nil {
		writeQueryError(w, err)
		return
	}
	pr.Diffs, err = h.getPRDiffsByInternalID(r.Context(), internalID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	pr.Comments, err = h.getPRCommentsByInternalID(r.Context(), internalID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	pr.Reviews, err = h.getPRReviewsByInternalID(r.Context(), internalID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	pr.Checks, err = h.getPRChecksByInternalID(r.Context(), internalID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	writeJSON(w, http.StatusCreated, pr)
}

func (h *Handler) CreatePRComment(w http.ResponseWriter, r *http.Request) {
	actor, err := h.authenticatedCitizen(r.Context())
	if err != nil {
		writeAuthOrQueryError(w, err)
		return
	}

	var input createCommentRequest
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeErrorMessage(w, http.StatusBadRequest, "invalid JSON body")
		return
	}

	input.Content = strings.TrimSpace(input.Content)
	if input.Content == "" {
		writeErrorMessage(w, http.StatusBadRequest, "content is required")
		return
	}

	prID, publicID, err := h.findPRIdentity(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		writeQueryError(w, err)
		return
	}

	tx, err := h.db.Begin(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	defer rollbackTx(r.Context(), tx)

	var comment PRComment
	var createdAt time.Time
	err = tx.QueryRow(r.Context(), `
		INSERT INTO pr_comments (civic_pr_id, citizen_id, author_name, content)
		VALUES ($1::uuid, $2::uuid, $3, $4)
		RETURNING id::text, author_name, content, created_at
	`, prID, actor.ID, actor.Name, input.Content).Scan(
		&comment.ID,
		&comment.AuthorName,
		&comment.Content,
		&createdAt,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	if err := insertAuditEvent(r.Context(), tx, actor, "pr.comment.created", "civic_pr", prID, publicID, map[string]any{
		"commentId": comment.ID,
	}); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	if err := tx.Commit(r.Context()); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	comment.CreatedAt = formatDateTime(createdAt)
	writeJSON(w, http.StatusCreated, comment)
}

func (h *Handler) UpvotePR(w http.ResponseWriter, r *http.Request) {
	actor, err := h.authenticatedCitizen(r.Context())
	if err != nil {
		writeAuthOrQueryError(w, err)
		return
	}

	prID, publicID, err := h.findPRIdentity(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		writeQueryError(w, err)
		return
	}

	tx, err := h.db.Begin(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	defer rollbackTx(r.Context(), tx)

	inserted, err := insertPRUpvote(r.Context(), tx, prID, actor.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	if inserted {
		if _, err := tx.Exec(r.Context(), `
			UPDATE civic_prs
			SET upvotes = upvotes + 1
			WHERE id = $1::uuid
		`, prID); err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}

		if err := insertAuditEvent(r.Context(), tx, actor, "pr.upvoted", "civic_pr", prID, publicID, nil); err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}
	}

	if err := tx.Commit(r.Context()); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	pr, internalID, err := h.findCivicPR(r.Context(), publicID)
	if err != nil {
		writeQueryError(w, err)
		return
	}
	pr.Diffs, err = h.getPRDiffsByInternalID(r.Context(), internalID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	pr.Comments, err = h.getPRCommentsByInternalID(r.Context(), internalID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	pr.Reviews, err = h.getPRReviewsByInternalID(r.Context(), internalID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	pr.Checks, err = h.getPRChecksByInternalID(r.Context(), internalID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	writeJSON(w, http.StatusOK, pr)
}

func (h *Handler) GetPRDiff(w http.ResponseWriter, r *http.Request) {
	internalID, err := h.findCivicPRInternalID(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		writeQueryError(w, err)
		return
	}

	diffs, err := h.getPRDiffsByInternalID(r.Context(), internalID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	writeJSON(w, http.StatusOK, diffs)
}

func (h *Handler) GetPRReviews(w http.ResponseWriter, r *http.Request) {
	internalID, err := h.findCivicPRInternalID(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		writeQueryError(w, err)
		return
	}

	reviews, err := h.getPRReviewsByInternalID(r.Context(), internalID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	writeJSON(w, http.StatusOK, reviews)
}

func (h *Handler) GetPRChecks(w http.ResponseWriter, r *http.Request) {
	internalID, err := h.findCivicPRInternalID(r.Context(), chi.URLParam(r, "id"))
	if err != nil {
		writeQueryError(w, err)
		return
	}

	checks, err := h.getPRChecksByInternalID(r.Context(), internalID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	writeJSON(w, http.StatusOK, checks)
}

func (h *Handler) ListReleases(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(r.Context(), `
		SELECT
			version,
			title,
			release_date,
			repository_name,
			changelog,
			incorporated_pr_public_ids,
			affected_articles_count,
			official_document_url,
			promulgated_by
		FROM releases
		ORDER BY release_date DESC, version DESC
	`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	defer rows.Close()

	releases := make([]Release, 0)
	for rows.Next() {
		var release Release
		var releaseDate time.Time
		var officialDocumentURL sql.NullString

		if err := rows.Scan(
			&release.ID,
			&release.Title,
			&releaseDate,
			&release.RepositoryName,
			&release.Changelog,
			&release.IncorporatedPRIDs,
			&release.AffectedArticlesCount,
			&officialDocumentURL,
			&release.PromulgatedBy,
		); err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}

		release.Date = formatBrazilianDate(releaseDate)
		release.OfficialDocumentURL = nullStringPtr(officialDocumentURL)
		releases = append(releases, release)
	}

	if err := rows.Err(); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	writeJSON(w, http.StatusOK, releases)
}

func (h *Handler) ListExecutions(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(r.Context(), `
		SELECT
			et.id::text,
			et.title,
			COALESCE(cp.public_id, et.original_pr_public_id),
			et.norm_reference,
			et.responsible_department,
			et.deadline,
			et.status,
			et.progress_percentage,
			et.budget_allocated::text,
			et.budget_spent::text
		FROM execution_trackers et
		LEFT JOIN civic_prs cp ON cp.id = et.original_pr_id
		ORDER BY et.created_at DESC
	`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	defer rows.Close()

	executions := make([]ExecutionTracker, 0)
	for rows.Next() {
		var execution ExecutionTracker
		var originalPRID sql.NullString
		var deadline sql.NullTime

		if err := rows.Scan(
			&execution.ID,
			&execution.Title,
			&originalPRID,
			&execution.NormReference,
			&execution.ResponsibleDepartment,
			&deadline,
			&execution.Status,
			&execution.ProgressPercentage,
			&execution.BudgetAllocated,
			&execution.BudgetSpent,
		); err != nil {
			writeError(w, http.StatusInternalServerError, err)
			return
		}

		execution.OriginalPRID = nullStringPtr(originalPRID)
		if deadline.Valid {
			formatted := formatDate(deadline.Time)
			execution.Deadline = &formatted
		}
		execution.Evidence = []ExecutionEvidence{}
		execution.Updates = []ExecutionUpdate{}
		executions = append(executions, execution)
	}

	if err := rows.Err(); err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	writeJSON(w, http.StatusOK, executions)
}

func (h *Handler) GetPublicStats(w http.ResponseWriter, r *http.Request) {
	var stats PublicStats

	err := h.db.QueryRow(r.Context(), `
		SELECT
			(SELECT COUNT(*)::int FROM citizens) AS total_citizens,
			(SELECT COUNT(*)::int FROM law_articles) AS organic_law_articles,
			(SELECT COUNT(*)::int FROM issues WHERE status NOT IN ('Resolvida', 'Arquivada')) AS open_issues_count,
			(SELECT COUNT(*)::int FROM civic_prs WHERE status NOT IN ('Incorporado ao texto oficial', 'Rejeitado', 'Arquivado')) AS prs_in_review_count,
			(SELECT COUNT(*)::int FROM votings WHERE status = 'Aberta') AS active_votings_count,
			(SELECT COUNT(*)::int FROM releases) AS releases_count
	`).Scan(
		&stats.TotalCitizens,
		&stats.OrganicLawArticles,
		&stats.OpenIssuesCount,
		&stats.PRsInReviewCount,
		&stats.ActiveVotingsCount,
		&stats.ReleasesCount,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}

	if stats.TotalCitizens > 0 {
		stats.CivicParticipationRate = "100%"
	} else {
		stats.CivicParticipationRate = "0%"
	}
	writeJSON(w, http.StatusOK, stats)
}

func (h *Handler) findTerritory(ctx context.Context, identifier string) (Territory, error) {
	var territory Territory

	err := h.db.QueryRow(ctx, `
		SELECT
			t.slug,
			t.name,
			t.zone,
			COUNT(DISTINCT i.id) FILTER (WHERE i.status NOT IN ('Resolvida', 'Arquivada'))::int AS active_issues_count,
			COUNT(DISTINCT cp.id)::int AS linked_prs_count,
			COUNT(DISTINCT v.id) FILTER (WHERE v.status = 'Aberta')::int AS active_votings_count,
			COUNT(DISTINCT et.id) FILTER (WHERE et.status NOT IN ('Cumprida', 'Suspensa judicialmente'))::int AS execution_projects_count,
			COUNT(DISTINCT c.id)::int AS active_citizens_count
		FROM territories t
		LEFT JOIN issues i ON i.territory_id = t.id
		LEFT JOIN civic_prs cp ON i.public_id = ANY(cp.linked_issue_public_ids)
			OR cp.citizen_summary ILIKE '%' || t.name || '%'
			OR cp.affected_articles ILIKE '%' || t.name || '%'
		LEFT JOIN votings v ON v.civic_pr_id = cp.id
		LEFT JOIN execution_trackers et ON et.original_pr_id = cp.id
		LEFT JOIN citizens c ON c.territory_id = t.id
		WHERE t.id::text = $1 OR t.slug = $1
		GROUP BY t.id, t.slug, t.name, t.zone
	`, identifier).Scan(
		&territory.ID,
		&territory.Name,
		&territory.Zone,
		&territory.ActiveIssuesCount,
		&territory.LinkedPRsCount,
		&territory.ActiveVotingsCount,
		&territory.ExecutionProjectsCount,
		&territory.ActiveCitizensCount,
	)
	if err != nil {
		return Territory{}, err
	}

	return territory, nil
}

func (h *Handler) findLawArticle(ctx context.Context, identifier string) (LawArticle, error) {
	row := h.db.QueryRow(ctx, `
		SELECT
			id::text,
			article_number,
			title,
			content,
			citizen_explanation,
			chapter,
			section,
			version,
			last_updated,
			amendment_number
		FROM law_articles
		WHERE id::text = $1
			OR ('art-' || article_number::text) = $1
			OR article_number::text = $1
	`, identifier)

	return scanLawArticle(row)
}

func (h *Handler) findIssue(ctx context.Context, identifier string) (Issue, string, error) {
	row := h.db.QueryRow(ctx, `
		SELECT
			i.id::text,
			i.public_id,
			i.title,
			i.type,
			i.territory_name,
			i.theme,
			i.description,
			i.author_name,
			i.created_at,
			i.status,
			i.upvotes,
			i.assigned_department,
			i.related_repository,
			i.linked_pr_public_id,
			la.article_number
		FROM issues i
		LEFT JOIN law_articles la ON la.id = i.related_article_id
		WHERE i.id::text = $1 OR i.public_id = $1
	`, identifier)

	issue, internalID, err := scanIssueBase(row)
	if err != nil {
		return Issue{}, "", err
	}

	issue.Comments, err = h.getIssueCommentsByInternalID(ctx, internalID)
	if err != nil {
		return Issue{}, "", err
	}

	return issue, internalID, nil
}

func (h *Handler) findCivicPR(ctx context.Context, identifier string) (CivicPR, string, error) {
	row := h.db.QueryRow(ctx, `
		SELECT
			cp.id::text,
			cp.public_id,
			cp.title,
			cp.repository,
			cp.target_title,
			cp.affected_articles,
			cp.author_name,
			cp.author_type,
			cp.status,
			cp.citizen_summary,
			cp.justification,
			cp.linked_issue_public_ids,
			cp.upvotes,
			v.public_id,
			cp.created_at
		FROM civic_prs cp
		LEFT JOIN votings v ON v.id = cp.voting_id
		WHERE cp.id::text = $1 OR cp.public_id = $1
	`, identifier)

	return scanCivicPRBase(row)
}

func (h *Handler) findCivicPRInternalID(ctx context.Context, identifier string) (string, error) {
	var id string
	err := h.db.QueryRow(ctx, `
		SELECT id::text
		FROM civic_prs
		WHERE id::text = $1 OR public_id = $1
	`, identifier).Scan(&id)
	if err != nil {
		return "", err
	}

	return id, nil
}

func (h *Handler) getPRDiffsByInternalID(ctx context.Context, internalID string) ([]NormativeDiff, error) {
	rows, err := h.db.Query(ctx, `
		SELECT
			id::text,
			article_number,
			title_ref,
			before_text,
			after_text,
			rationale
		FROM normative_diffs
		WHERE civic_pr_id = $1::uuid
		ORDER BY sort_order ASC, article_number ASC
	`, internalID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	diffs := make([]NormativeDiff, 0)
	for rows.Next() {
		var diffID string
		var diff NormativeDiff

		if err := rows.Scan(
			&diffID,
			&diff.ArticleNumber,
			&diff.TitleRef,
			&diff.BeforeText,
			&diff.AfterText,
			&diff.Rationale,
		); err != nil {
			return nil, err
		}

		diff.Lines, err = h.getDiffLines(ctx, diffID)
		if err != nil {
			return nil, err
		}

		diffs = append(diffs, diff)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return diffs, nil
}

func (h *Handler) getDiffLines(ctx context.Context, diffID string) ([]DiffLine, error) {
	rows, err := h.db.Query(ctx, `
		SELECT line_type, content
		FROM normative_diff_lines
		WHERE normative_diff_id = $1::uuid
		ORDER BY line_number ASC
	`, diffID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	lines := make([]DiffLine, 0)
	for rows.Next() {
		var line DiffLine
		if err := rows.Scan(&line.Type, &line.Content); err != nil {
			return nil, err
		}
		lines = append(lines, line)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return lines, nil
}

func (h *Handler) getPRReviewsByInternalID(ctx context.Context, internalID string) ([]PRReview, error) {
	rows, err := h.db.Query(ctx, `
		SELECT
			id::text,
			reviewer_name,
			reviewer_role,
			status,
			conclusion,
			feedback,
			created_at
		FROM pr_reviews
		WHERE civic_pr_id = $1::uuid
		ORDER BY created_at ASC
	`, internalID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	reviews := make([]PRReview, 0)
	for rows.Next() {
		var review PRReview
		var createdAt time.Time

		if err := rows.Scan(
			&review.ID,
			&review.ReviewerName,
			&review.ReviewerRole,
			&review.Status,
			&review.Conclusion,
			&review.Feedback,
			&createdAt,
		); err != nil {
			return nil, err
		}

		review.CreatedAt = formatDateTime(createdAt)
		reviews = append(reviews, review)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return reviews, nil
}

func (h *Handler) getPRChecksByInternalID(ctx context.Context, internalID string) ([]InstitutionalCheck, error) {
	rows, err := h.db.Query(ctx, `
		SELECT
			id::text,
			name,
			description,
			status,
			feedback
		FROM institutional_checks
		WHERE civic_pr_id = $1::uuid
		ORDER BY created_at ASC
	`, internalID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	checks := make([]InstitutionalCheck, 0)
	for rows.Next() {
		var check InstitutionalCheck
		if err := rows.Scan(
			&check.ID,
			&check.Name,
			&check.Description,
			&check.Status,
			&check.Feedback,
		); err != nil {
			return nil, err
		}
		checks = append(checks, check)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return checks, nil
}

func (h *Handler) getIssueCommentsByInternalID(ctx context.Context, internalID string) ([]IssueComment, error) {
	rows, err := h.db.Query(ctx, `
		SELECT id::text, author_name, content, created_at
		FROM issue_comments
		WHERE issue_id = $1::uuid
		ORDER BY created_at ASC
	`, internalID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	comments := make([]IssueComment, 0)
	for rows.Next() {
		var comment IssueComment
		var createdAt time.Time
		if err := rows.Scan(&comment.ID, &comment.AuthorName, &comment.Content, &createdAt); err != nil {
			return nil, err
		}

		comment.CreatedAt = formatDateTime(createdAt)
		comments = append(comments, comment)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return comments, nil
}

func (h *Handler) getPRCommentsByInternalID(ctx context.Context, internalID string) ([]PRComment, error) {
	rows, err := h.db.Query(ctx, `
		SELECT id::text, author_name, content, created_at
		FROM pr_comments
		WHERE civic_pr_id = $1::uuid
		ORDER BY created_at ASC
	`, internalID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	comments := make([]PRComment, 0)
	for rows.Next() {
		var comment PRComment
		var createdAt time.Time
		if err := rows.Scan(&comment.ID, &comment.AuthorName, &comment.Content, &createdAt); err != nil {
			return nil, err
		}

		comment.CreatedAt = formatDateTime(createdAt)
		comments = append(comments, comment)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return comments, nil
}

func (h *Handler) authenticatedCitizen(ctx context.Context) (citizenActor, error) {
	citizenID, ok := auth.CitizenIDFromContext(ctx)
	if !ok {
		return citizenActor{}, errMissingAuthenticatedCitizen
	}

	var actor citizenActor
	err := h.db.QueryRow(ctx, `
		SELECT id::text, full_name, role
		FROM citizens
		WHERE id = $1::uuid
	`, citizenID).Scan(&actor.ID, &actor.Name, &actor.Role)
	if err != nil {
		return citizenActor{}, err
	}

	return actor, nil
}

func (h *Handler) resolveIssueTerritory(ctx context.Context, territoryID *string, territory *string) (*string, string, error) {
	identifier := strings.TrimSpace(valueOrEmpty(territoryID))
	if identifier == "" {
		identifier = strings.TrimSpace(valueOrEmpty(territory))
	}
	if identifier == "" || strings.EqualFold(identifier, "Todo o Município") || strings.EqualFold(identifier, "Todo o Municipio") {
		return nil, "Todo o Município", nil
	}

	var id string
	var name string
	err := h.db.QueryRow(ctx, `
		SELECT id::text, name
		FROM territories
		WHERE id::text = $1
			OR slug = $1
			OR lower(name) = lower($1)
	`, identifier).Scan(&id, &name)
	if err != nil {
		return nil, "", err
	}

	return &id, name, nil
}

func (h *Handler) resolveArticleInternalID(ctx context.Context, articleID *string) (*string, error) {
	identifier := strings.TrimSpace(valueOrEmpty(articleID))
	if identifier == "" {
		return nil, nil
	}

	var id string
	err := h.db.QueryRow(ctx, `
		SELECT id::text
		FROM law_articles
		WHERE id::text = $1
			OR ('art-' || article_number::text) = $1
			OR article_number::text = $1
	`, identifier).Scan(&id)
	if err != nil {
		return nil, err
	}

	return &id, nil
}

func (h *Handler) findIssueIdentity(ctx context.Context, identifier string) (string, string, error) {
	var id string
	var publicID string
	err := h.db.QueryRow(ctx, `
		SELECT id::text, public_id
		FROM issues
		WHERE id::text = $1 OR public_id = $1
	`, identifier).Scan(&id, &publicID)
	return id, publicID, err
}

func (h *Handler) findPRIdentity(ctx context.Context, identifier string) (string, string, error) {
	var id string
	var publicID string
	err := h.db.QueryRow(ctx, `
		SELECT id::text, public_id
		FROM civic_prs
		WHERE id::text = $1 OR public_id = $1
	`, identifier).Scan(&id, &publicID)
	return id, publicID, err
}

func (h *Handler) insertNormativeDiffs(ctx context.Context, tx pgx.Tx, civicPRID string, diffs []NormativeDiff) error {
	for diffIndex, diff := range diffs {
		if diff.ArticleNumber <= 0 {
			return fmt.Errorf("diffs[%d].articleNumber must be greater than zero", diffIndex)
		}

		diff.TitleRef = strings.TrimSpace(diff.TitleRef)
		diff.BeforeText = strings.TrimSpace(diff.BeforeText)
		diff.AfterText = strings.TrimSpace(diff.AfterText)
		diff.Rationale = strings.TrimSpace(diff.Rationale)
		if diff.TitleRef == "" || diff.BeforeText == "" || diff.AfterText == "" || diff.Rationale == "" {
			return fmt.Errorf("diffs[%d] must include titleRef, beforeText, afterText and rationale", diffIndex)
		}

		var articleID sql.NullString
		if err := tx.QueryRow(ctx, `
			SELECT id::text
			FROM law_articles
			WHERE article_number = $1
		`, diff.ArticleNumber).Scan(&articleID.String); err != nil && !errors.Is(err, pgx.ErrNoRows) {
			return err
		} else if err == nil {
			articleID.Valid = true
		}

		var diffID string
		err := tx.QueryRow(ctx, `
			INSERT INTO normative_diffs (
				civic_pr_id,
				article_id,
				article_number,
				title_ref,
				before_text,
				after_text,
				rationale,
				sort_order
			)
			VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8)
			RETURNING id::text
		`,
			civicPRID,
			nullStringFromSQL(articleID),
			diff.ArticleNumber,
			diff.TitleRef,
			diff.BeforeText,
			diff.AfterText,
			diff.Rationale,
			diffIndex+1,
		).Scan(&diffID)
		if err != nil {
			return err
		}

		for lineIndex, line := range diff.Lines {
			line.Type = strings.TrimSpace(line.Type)
			line.Content = strings.TrimSpace(line.Content)
			if line.Type != "added" && line.Type != "removed" && line.Type != "neutral" {
				return fmt.Errorf("diffs[%d].lines[%d].type must be added, removed or neutral", diffIndex, lineIndex)
			}
			if line.Content == "" {
				return fmt.Errorf("diffs[%d].lines[%d].content is required", diffIndex, lineIndex)
			}

			if _, err := tx.Exec(ctx, `
				INSERT INTO normative_diff_lines (normative_diff_id, line_number, line_type, content)
				VALUES ($1::uuid, $2, $3, $4)
			`, diffID, lineIndex+1, line.Type, line.Content); err != nil {
				return err
			}
		}
	}

	return nil
}

type scanner interface {
	Scan(dest ...any) error
}

func scanLawArticle(row scanner) (LawArticle, error) {
	var article LawArticle
	var internalID string
	var section sql.NullString
	var amendmentNumber sql.NullString
	var lastUpdated sql.NullTime

	if err := row.Scan(
		&internalID,
		&article.Number,
		&article.Title,
		&article.Content,
		&article.CitizenExplanation,
		&article.Chapter,
		&section,
		&article.Version,
		&lastUpdated,
		&amendmentNumber,
	); err != nil {
		return LawArticle{}, err
	}

	article.ID = articleID(article.Number)
	article.Section = nullStringPtr(section)
	article.AmendmentNumber = nullStringPtr(amendmentNumber)
	if lastUpdated.Valid {
		article.LastUpdated = formatBrazilianDate(lastUpdated.Time)
	}
	article.Comments = []ArticleComment{}

	_ = internalID
	return article, nil
}

func scanIssueBase(row scanner) (Issue, string, error) {
	var issue Issue
	var internalID string
	var createdAt time.Time
	var assignedDepartment sql.NullString
	var relatedRepository sql.NullString
	var linkedPRID sql.NullString
	var relatedArticleNumber sql.NullInt64

	if err := row.Scan(
		&internalID,
		&issue.ID,
		&issue.Title,
		&issue.Type,
		&issue.Territory,
		&issue.Theme,
		&issue.Description,
		&issue.AuthorName,
		&createdAt,
		&issue.Status,
		&issue.Upvotes,
		&assignedDepartment,
		&relatedRepository,
		&linkedPRID,
		&relatedArticleNumber,
	); err != nil {
		return Issue{}, "", err
	}

	issue.CreatedAt = formatDateTime(createdAt)
	issue.AssignedDepartment = nullStringPtr(assignedDepartment)
	issue.RelatedRepository = nullStringPtr(relatedRepository)
	issue.LinkedPRID = nullStringPtr(linkedPRID)
	issue.Comments = []IssueComment{}

	if relatedArticleNumber.Valid {
		id := articleID(int(relatedArticleNumber.Int64))
		issue.RelatedArticleID = &id
	}

	return issue, internalID, nil
}

func scanCivicPRBase(row scanner) (CivicPR, string, error) {
	var pr CivicPR
	var internalID string
	var votingID sql.NullString
	var createdAt time.Time

	if err := row.Scan(
		&internalID,
		&pr.ID,
		&pr.Title,
		&pr.Repository,
		&pr.TargetTitle,
		&pr.AffectedArticles,
		&pr.AuthorName,
		&pr.AuthorType,
		&pr.Status,
		&pr.CitizenSummary,
		&pr.Justification,
		&pr.LinkedIssueIDs,
		&pr.Upvotes,
		&votingID,
		&createdAt,
	); err != nil {
		return CivicPR{}, "", err
	}

	pr.VotingID = nullStringPtr(votingID)
	pr.CreatedAt = formatDateTime(createdAt)
	pr.Diffs = []NormativeDiff{}
	pr.Comments = []PRComment{}
	pr.Reviews = []PRReview{}
	pr.Checks = []InstitutionalCheck{}
	pr.MergeTimeline = []MergeTimelineItem{}

	return pr, internalID, nil
}

var errMissingAuthenticatedCitizen = errors.New("missing authenticated citizen")

func nextPublicID(ctx context.Context, tx pgx.Tx, tableName string) (string, error) {
	var advisoryKey int64
	var query string

	switch tableName {
	case "issues":
		advisoryKey = 2026061001
		query = `
			SELECT COALESCE(MAX(substring(public_id from 2)::int), 0) + 1
			FROM issues
			WHERE public_id ~ '^#[0-9]+$'
		`
	case "civic_prs":
		advisoryKey = 2026061002
		query = `
			SELECT COALESCE(MAX(substring(public_id from 2)::int), 0) + 1
			FROM civic_prs
			WHERE public_id ~ '^#[0-9]+$'
		`
	default:
		return "", fmt.Errorf("unsupported public id table %q", tableName)
	}

	if _, err := tx.Exec(ctx, "SELECT pg_advisory_xact_lock($1)", advisoryKey); err != nil {
		return "", err
	}

	var nextNumber int
	if err := tx.QueryRow(ctx, query).Scan(&nextNumber); err != nil {
		return "", err
	}

	return fmt.Sprintf("#%03d", nextNumber), nil
}

func insertIssueUpvote(ctx context.Context, tx pgx.Tx, issueID string, citizenID string) (bool, error) {
	commandTag, err := tx.Exec(ctx, `
		INSERT INTO issue_upvotes (issue_id, citizen_id)
		VALUES ($1::uuid, $2::uuid)
		ON CONFLICT (issue_id, citizen_id) DO NOTHING
	`, issueID, citizenID)
	if err != nil {
		return false, err
	}

	return commandTag.RowsAffected() > 0, nil
}

func insertPRUpvote(ctx context.Context, tx pgx.Tx, civicPRID string, citizenID string) (bool, error) {
	commandTag, err := tx.Exec(ctx, `
		INSERT INTO pr_upvotes (civic_pr_id, citizen_id)
		VALUES ($1::uuid, $2::uuid)
		ON CONFLICT (civic_pr_id, citizen_id) DO NOTHING
	`, civicPRID, citizenID)
	if err != nil {
		return false, err
	}

	return commandTag.RowsAffected() > 0, nil
}

func insertAuditEvent(ctx context.Context, tx pgx.Tx, actor citizenActor, action string, entityType string, entityID string, entityPublicID string, metadata map[string]any) error {
	if metadata == nil {
		metadata = map[string]any{}
	}

	metadataJSON, err := json.Marshal(metadata)
	if err != nil {
		return err
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO audit_events (
			actor_type,
			actor_id,
			actor_name,
			action,
			entity_type,
			entity_id,
			entity_public_id,
			metadata
		)
		VALUES ('citizen', $1::uuid, $2, $3, $4, $5::uuid, $6, $7::jsonb)
	`, actor.ID, actor.Name, action, entityType, entityID, entityPublicID, string(metadataJSON))

	return err
}

func rollbackTx(ctx context.Context, tx pgx.Tx) {
	_ = tx.Rollback(ctx)
}

func valueOrEmpty(value *string) string {
	if value == nil {
		return ""
	}

	return *value
}

func nullableString(value *string) any {
	if value == nil {
		return nil
	}

	cleaned := strings.TrimSpace(*value)
	if cleaned == "" {
		return nil
	}

	return cleaned
}

func nullStringFromSQL(value sql.NullString) any {
	if !value.Valid {
		return nil
	}

	return value.String
}

func cleanStringList(values []string) []string {
	cleaned := make([]string, 0, len(values))
	for _, value := range values {
		value = strings.TrimSpace(value)
		if value != "" {
			cleaned = append(cleaned, value)
		}
	}

	return cleaned
}

func articleID(number int) string {
	return "art-" + strconv.Itoa(number)
}

func nullStringPtr(value sql.NullString) *string {
	if !value.Valid {
		return nil
	}

	return &value.String
}

func formatDate(value time.Time) string {
	return value.UTC().Format("2006-01-02")
}

func formatBrazilianDate(value time.Time) string {
	return value.Format("02/01/2006")
}

func formatDateTime(value time.Time) string {
	return value.UTC().Format(time.RFC3339)
}

func writeQueryError(w http.ResponseWriter, err error) {
	if errors.Is(err, pgx.ErrNoRows) {
		writeErrorMessage(w, http.StatusNotFound, "resource not found")
		return
	}

	writeError(w, http.StatusInternalServerError, err)
}

func writeAuthOrQueryError(w http.ResponseWriter, err error) {
	if errors.Is(err, errMissingAuthenticatedCitizen) || errors.Is(err, pgx.ErrNoRows) {
		writeErrorMessage(w, http.StatusUnauthorized, "missing authenticated citizen")
		return
	}

	writeError(w, http.StatusInternalServerError, err)
}

func writeError(w http.ResponseWriter, statusCode int, err error) {
	writeErrorMessage(w, statusCode, err.Error())
}

func writeErrorMessage(w http.ResponseWriter, statusCode int, message string) {
	writeJSON(w, statusCode, apiError{Error: message})
}

func writeJSON(w http.ResponseWriter, statusCode int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(payload)
}
