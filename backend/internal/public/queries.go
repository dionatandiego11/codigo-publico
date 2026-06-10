package publicapi

import (
	"context"
	"strings"
	"time"

	"codigo-publico/backend/internal/auth"

	"github.com/jackc/pgx/v5"
)

func (r *Repository) findTerritory(ctx context.Context, identifier string) (Territory, error) {
	var territory Territory

	err := r.db.QueryRow(ctx, `
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

func (r *Repository) findLawArticle(ctx context.Context, identifier string) (LawArticle, error) {
	row := r.db.QueryRow(ctx, `
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

func (r *Repository) findIssue(ctx context.Context, identifier string) (Issue, string, error) {
	row := r.db.QueryRow(ctx, `
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

	issue.Comments, err = r.getIssueCommentsByInternalID(ctx, internalID)
	if err != nil {
		return Issue{}, "", err
	}

	return issue, internalID, nil
}

func (r *Repository) findCivicPR(ctx context.Context, identifier string) (CivicPR, string, error) {
	row := r.db.QueryRow(ctx, `
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

func (r *Repository) findCivicPRInternalID(ctx context.Context, identifier string) (string, error) {
	var id string
	err := r.db.QueryRow(ctx, `
		SELECT id::text
		FROM civic_prs
		WHERE id::text = $1 OR public_id = $1
	`, identifier).Scan(&id)
	if err != nil {
		return "", err
	}

	return id, nil
}

func (r *Repository) findVoting(ctx context.Context, identifier string) (Voting, string, error) {
	row := r.db.QueryRow(ctx, votingSelectSQL()+`
		WHERE id::text = $1 OR public_id = $1
	`, identifier)

	return scanVoting(row)
}

func votingSelectSQL() string {
	return `
		SELECT
			id::text,
			public_id,
			title,
			citizen_summary,
			text_changes,
			intended_impact,
			pros,
			cons,
			reviews_overview,
			deadline,
			quorum_needed,
			quorum_reached,
			votes_yes,
			votes_no,
			votes_abstain,
			status
		FROM votings
	`
}

func findVotingForUpdate(ctx context.Context, tx pgx.Tx, identifier string) (string, string, string, time.Time, error) {
	var id string
	var publicID string
	var status string
	var deadline time.Time

	err := tx.QueryRow(ctx, `
		SELECT id::text, public_id, status, deadline
		FROM votings
		WHERE id::text = $1 OR public_id = $1
		FOR UPDATE
	`, identifier).Scan(&id, &publicID, &status, &deadline)
	if err != nil {
		return "", "", "", time.Time{}, err
	}

	return id, publicID, status, deadline, nil
}

func (r *Repository) findRelease(ctx context.Context, identifier string) (Release, error) {
	row := r.db.QueryRow(ctx, releaseSelectSQL()+`
		WHERE id::text = $1 OR version = $1
	`, identifier)

	return scanRelease(row)
}

func releaseSelectSQL() string {
	return `
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
	`
}

func (r *Repository) getPRDiffsByInternalID(ctx context.Context, internalID string) ([]NormativeDiff, error) {
	rows, err := r.db.Query(ctx, `
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

		diff.Lines, err = r.getDiffLines(ctx, diffID)
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

func (r *Repository) getDiffLines(ctx context.Context, diffID string) ([]DiffLine, error) {
	rows, err := r.db.Query(ctx, `
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

func (r *Repository) getPRReviewsByInternalID(ctx context.Context, internalID string) ([]PRReview, error) {
	rows, err := r.db.Query(ctx, `
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

func (r *Repository) getPRChecksByInternalID(ctx context.Context, internalID string) ([]InstitutionalCheck, error) {
	rows, err := r.db.Query(ctx, `
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

func (r *Repository) getIssueCommentsByInternalID(ctx context.Context, internalID string) ([]IssueComment, error) {
	rows, err := r.db.Query(ctx, `
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

func (r *Repository) getPRCommentsByInternalID(ctx context.Context, internalID string) ([]PRComment, error) {
	rows, err := r.db.Query(ctx, `
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

func (r *Repository) authenticatedCitizen(ctx context.Context) (citizenActor, error) {
	citizenID, ok := auth.CitizenIDFromContext(ctx)
	if !ok {
		return citizenActor{}, errMissingAuthenticatedCitizen
	}

	var actor citizenActor
	err := r.db.QueryRow(ctx, `
		SELECT id::text, full_name, role
		FROM citizens
		WHERE id = $1::uuid
	`, citizenID).Scan(&actor.ID, &actor.Name, &actor.Role)
	if err != nil {
		return citizenActor{}, err
	}

	return actor, nil
}

func (r *Repository) resolveIssueTerritory(ctx context.Context, territoryID *string, territory *string) (*string, string, error) {
	identifier := strings.TrimSpace(valueOrEmpty(territoryID))
	if identifier == "" {
		identifier = strings.TrimSpace(valueOrEmpty(territory))
	}
	if identifier == "" || strings.EqualFold(identifier, "Todo o Município") || strings.EqualFold(identifier, "Todo o Municipio") {
		return nil, "Todo o Município", nil
	}

	var id string
	var name string
	err := r.db.QueryRow(ctx, `
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

func (r *Repository) resolveArticleInternalID(ctx context.Context, articleID *string) (*string, error) {
	identifier := strings.TrimSpace(valueOrEmpty(articleID))
	if identifier == "" {
		return nil, nil
	}

	var id string
	err := r.db.QueryRow(ctx, `
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

func (r *Repository) findIssueIdentity(ctx context.Context, identifier string) (string, string, error) {
	var id string
	var publicID string
	err := r.db.QueryRow(ctx, `
		SELECT id::text, public_id
		FROM issues
		WHERE id::text = $1 OR public_id = $1
	`, identifier).Scan(&id, &publicID)
	return id, publicID, err
}

func (r *Repository) findPRIdentity(ctx context.Context, identifier string) (string, string, error) {
	var id string
	var publicID string
	err := r.db.QueryRow(ctx, `
		SELECT id::text, public_id
		FROM civic_prs
		WHERE id::text = $1 OR public_id = $1
	`, identifier).Scan(&id, &publicID)
	return id, publicID, err
}
