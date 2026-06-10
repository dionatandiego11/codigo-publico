package publicapi

import (
	"context"
	"database/sql"
)

func (r *Repository) ListTerritories(ctx context.Context) ([]Territory, error) {
	rows, err := r.db.Query(ctx, `
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
		return nil, err
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
			return nil, err
		}

		territories = append(territories, territory)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return territories, nil
}

func (r *Repository) GetTerritory(ctx context.Context, identifier string) (Territory, error) {
	return r.findTerritory(ctx, identifier)
}

func (r *Repository) ListLawArticles(ctx context.Context) ([]LawArticle, error) {
	rows, err := r.db.Query(ctx, `
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
		return nil, err
	}
	defer rows.Close()

	articles := make([]LawArticle, 0)
	for rows.Next() {
		article, err := scanLawArticle(rows)
		if err != nil {
			return nil, err
		}

		articles = append(articles, article)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return articles, nil
}

func (r *Repository) GetLawArticle(ctx context.Context, identifier string) (LawArticle, error) {
	return r.findLawArticle(ctx, identifier)
}

func (r *Repository) ListIssues(ctx context.Context) ([]Issue, error) {
	rows, err := r.db.Query(ctx, `
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
		return nil, err
	}
	defer rows.Close()

	issues := make([]Issue, 0)
	for rows.Next() {
		issue, internalID, err := scanIssueBase(rows)
		if err != nil {
			return nil, err
		}

		issue.Comments, err = r.getIssueCommentsByInternalID(ctx, internalID)
		if err != nil {
			return nil, err
		}

		issues = append(issues, issue)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return issues, nil
}

func (r *Repository) GetIssue(ctx context.Context, identifier string) (Issue, error) {
	issue, _, err := r.findIssue(ctx, identifier)
	return issue, err
}

func (r *Repository) ListPRs(ctx context.Context) ([]CivicPR, error) {
	rows, err := r.db.Query(ctx, `
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
		return nil, err
	}
	defer rows.Close()

	prs := make([]CivicPR, 0)
	for rows.Next() {
		pr, internalID, err := scanCivicPRBase(rows)
		if err != nil {
			return nil, err
		}

		pr, err = r.hydrateCivicPR(ctx, pr, internalID)
		if err != nil {
			return nil, err
		}

		prs = append(prs, pr)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return prs, nil
}

func (r *Repository) GetPR(ctx context.Context, identifier string) (CivicPR, error) {
	pr, internalID, err := r.findCivicPR(ctx, identifier)
	if err != nil {
		return CivicPR{}, err
	}

	return r.hydrateCivicPR(ctx, pr, internalID)
}

func (r *Repository) GetPRDiff(ctx context.Context, identifier string) ([]NormativeDiff, error) {
	internalID, err := r.findCivicPRInternalID(ctx, identifier)
	if err != nil {
		return nil, err
	}

	return r.getPRDiffsByInternalID(ctx, internalID)
}

func (r *Repository) GetPRReviews(ctx context.Context, identifier string) ([]PRReview, error) {
	internalID, err := r.findCivicPRInternalID(ctx, identifier)
	if err != nil {
		return nil, err
	}

	return r.getPRReviewsByInternalID(ctx, internalID)
}

func (r *Repository) GetPRChecks(ctx context.Context, identifier string) ([]InstitutionalCheck, error) {
	internalID, err := r.findCivicPRInternalID(ctx, identifier)
	if err != nil {
		return nil, err
	}

	return r.getPRChecksByInternalID(ctx, internalID)
}

func (r *Repository) hydrateCivicPR(ctx context.Context, pr CivicPR, internalID string) (CivicPR, error) {
	var err error

	pr.Diffs, err = r.getPRDiffsByInternalID(ctx, internalID)
	if err != nil {
		return CivicPR{}, err
	}

	pr.Reviews, err = r.getPRReviewsByInternalID(ctx, internalID)
	if err != nil {
		return CivicPR{}, err
	}

	pr.Checks, err = r.getPRChecksByInternalID(ctx, internalID)
	if err != nil {
		return CivicPR{}, err
	}

	pr.Comments, err = r.getPRCommentsByInternalID(ctx, internalID)
	if err != nil {
		return CivicPR{}, err
	}

	return pr, nil
}

func (r *Repository) ListVotings(ctx context.Context) ([]Voting, error) {
	rows, err := r.db.Query(ctx, votingSelectSQL()+`
		ORDER BY deadline ASC, public_id ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	votings := make([]Voting, 0)
	for rows.Next() {
		voting, _, err := scanVoting(rows)
		if err != nil {
			return nil, err
		}

		votings = append(votings, voting)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return votings, nil
}

func (r *Repository) GetVoting(ctx context.Context, identifier string) (Voting, error) {
	voting, _, err := r.findVoting(ctx, identifier)
	return voting, err
}

func (r *Repository) ListReleases(ctx context.Context) ([]Release, error) {
	rows, err := r.db.Query(ctx, releaseSelectSQL()+`
		ORDER BY release_date DESC, version DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	releases := make([]Release, 0)
	for rows.Next() {
		release, err := scanRelease(rows)
		if err != nil {
			return nil, err
		}

		releases = append(releases, release)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return releases, nil
}

func (r *Repository) GetRelease(ctx context.Context, identifier string) (Release, error) {
	return r.findRelease(ctx, identifier)
}

func (r *Repository) ListExecutions(ctx context.Context) ([]ExecutionTracker, error) {
	rows, err := r.db.Query(ctx, `
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
		return nil, err
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
			return nil, err
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
		return nil, err
	}

	return executions, nil
}

func (r *Repository) GetPublicStats(ctx context.Context) (PublicStats, error) {
	var stats PublicStats

	err := r.db.QueryRow(ctx, `
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
		return PublicStats{}, err
	}

	if stats.TotalCitizens > 0 {
		stats.CivicParticipationRate = "100%"
	} else {
		stats.CivicParticipationRate = "0%"
	}

	return stats, nil
}
