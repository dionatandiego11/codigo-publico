package publicapi

import (
	"context"
	"time"
)

func (r *Repository) CreateIssue(ctx context.Context, actor citizenActor, input createIssueRequest, territoryID *string, territoryName string, relatedArticleID *string) (Issue, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return Issue{}, err
	}
	defer rollbackTx(ctx, tx)

	publicID, err := nextPublicID(ctx, tx, "issues")
	if err != nil {
		return Issue{}, err
	}

	var internalID string
	err = tx.QueryRow(ctx, `
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
		VALUES ($1, $2, $3, $4::uuid, $5, $6, $7, $8, $9::uuid, $10, 1, $11, $12::uuid, $13, $14)
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
		issueStatusOpen,
		nullableString(input.AssignedDepartment),
		nullableString(relatedArticleID),
		nullableString(input.RelatedRepository),
		nullableString(input.LinkedPRID),
	).Scan(&internalID)
	if err != nil {
		return Issue{}, err
	}

	if _, err := tx.Exec(ctx, `
		INSERT INTO issue_upvotes (issue_id, citizen_id)
		VALUES ($1::uuid, $2::uuid)
	`, internalID, actor.ID); err != nil {
		return Issue{}, err
	}

	if err := insertAuditEvent(ctx, tx, actor, "issue.created", "issue", internalID, publicID, map[string]any{
		"title": input.Title,
		"type":  input.Type,
	}); err != nil {
		return Issue{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return Issue{}, err
	}

	return r.GetIssue(ctx, publicID)
}

func (r *Repository) CreateIssueComment(ctx context.Context, actor citizenActor, identifier string, input createCommentRequest) (IssueComment, error) {
	issueID, publicID, err := r.findIssueIdentity(ctx, identifier)
	if err != nil {
		return IssueComment{}, err
	}

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return IssueComment{}, err
	}
	defer rollbackTx(ctx, tx)

	var comment IssueComment
	var createdAt time.Time
	err = tx.QueryRow(ctx, `
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
		return IssueComment{}, err
	}

	if err := insertAuditEvent(ctx, tx, actor, "issue.comment.created", "issue", issueID, publicID, map[string]any{
		"commentId": comment.ID,
	}); err != nil {
		return IssueComment{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return IssueComment{}, err
	}

	comment.CreatedAt = formatDateTime(createdAt)
	return comment, nil
}

func (r *Repository) UpvoteIssue(ctx context.Context, actor citizenActor, identifier string) (Issue, error) {
	issueID, publicID, err := r.findIssueIdentity(ctx, identifier)
	if err != nil {
		return Issue{}, err
	}

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return Issue{}, err
	}
	defer rollbackTx(ctx, tx)

	inserted, err := insertIssueUpvote(ctx, tx, issueID, actor.ID)
	if err != nil {
		return Issue{}, err
	}

	if inserted {
		if _, err := tx.Exec(ctx, `
			UPDATE issues
			SET upvotes = upvotes + 1
			WHERE id = $1::uuid
		`, issueID); err != nil {
			return Issue{}, err
		}

		if err := insertAuditEvent(ctx, tx, actor, "issue.upvoted", "issue", issueID, publicID, nil); err != nil {
			return Issue{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return Issue{}, err
	}

	return r.GetIssue(ctx, publicID)
}
