package publicapi

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

func (r *Repository) CreatePR(ctx context.Context, actor citizenActor, input createPRRequest) (CivicPR, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return CivicPR{}, err
	}
	defer rollbackTx(ctx, tx)

	publicID, err := nextPublicID(ctx, tx, "civic_prs")
	if err != nil {
		return CivicPR{}, err
	}

	var internalID string
	err = tx.QueryRow(ctx, `
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
		return CivicPR{}, err
	}

	if _, err := tx.Exec(ctx, `
		INSERT INTO pr_upvotes (civic_pr_id, citizen_id)
		VALUES ($1::uuid, $2::uuid)
	`, internalID, actor.ID); err != nil {
		return CivicPR{}, err
	}

	if err := r.insertNormativeDiffs(ctx, tx, internalID, input.Diffs); err != nil {
		return CivicPR{}, newServiceError(http.StatusBadRequest, err.Error())
	}

	if err := insertAuditEvent(ctx, tx, actor, "pr.created", "civic_pr", internalID, publicID, map[string]any{
		"title":      input.Title,
		"repository": input.Repository,
	}); err != nil {
		return CivicPR{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return CivicPR{}, err
	}

	return r.GetPR(ctx, publicID)
}

func (r *Repository) CreatePRComment(ctx context.Context, actor citizenActor, identifier string, input createCommentRequest) (PRComment, error) {
	prID, publicID, err := r.findPRIdentity(ctx, identifier)
	if err != nil {
		return PRComment{}, err
	}

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return PRComment{}, err
	}
	defer rollbackTx(ctx, tx)

	var comment PRComment
	var createdAt time.Time
	err = tx.QueryRow(ctx, `
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
		return PRComment{}, err
	}

	if err := insertAuditEvent(ctx, tx, actor, "pr.comment.created", "civic_pr", prID, publicID, map[string]any{
		"commentId": comment.ID,
	}); err != nil {
		return PRComment{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return PRComment{}, err
	}

	comment.CreatedAt = formatDateTime(createdAt)
	return comment, nil
}

func (r *Repository) UpvotePR(ctx context.Context, actor citizenActor, identifier string) (CivicPR, error) {
	prID, publicID, err := r.findPRIdentity(ctx, identifier)
	if err != nil {
		return CivicPR{}, err
	}

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return CivicPR{}, err
	}
	defer rollbackTx(ctx, tx)

	inserted, err := insertPRUpvote(ctx, tx, prID, actor.ID)
	if err != nil {
		return CivicPR{}, err
	}

	if inserted {
		if _, err := tx.Exec(ctx, `
			UPDATE civic_prs
			SET upvotes = upvotes + 1
			WHERE id = $1::uuid
		`, prID); err != nil {
			return CivicPR{}, err
		}

		if err := insertAuditEvent(ctx, tx, actor, "pr.upvoted", "civic_pr", prID, publicID, nil); err != nil {
			return CivicPR{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return CivicPR{}, err
	}

	return r.GetPR(ctx, publicID)
}

func (r *Repository) MergePR(ctx context.Context, actor citizenActor, identifier string, input mergePRRequest, releaseDate time.Time) (mergePRResponse, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return mergePRResponse{}, err
	}
	defer rollbackTx(ctx, tx)

	prIdentity, err := findPRForMerge(ctx, tx, identifier)
	if err != nil {
		return mergePRResponse{}, err
	}
	if prIdentity.Status == "Incorporado ao texto oficial" {
		return mergePRResponse{}, newServiceError(http.StatusConflict, "PR already incorporated into official text")
	}
	if !canMergePRStatus(prIdentity.Status) {
		return mergePRResponse{}, newServiceError(http.StatusConflict, "PR status does not allow institutional merge")
	}

	releaseVersion := strings.TrimSpace(valueOrEmpty(input.Version))
	if releaseVersion == "" {
		releaseVersion, err = nextReleaseVersion(ctx, tx, releaseDate)
		if err != nil {
			return mergePRResponse{}, err
		}
	}

	releaseTitle := strings.TrimSpace(valueOrEmpty(input.ReleaseTitle))
	if releaseTitle == "" {
		releaseTitle = fmt.Sprintf("Release Legislativa %s", releaseVersion)
	}

	updatedArticles, changelog, err := mergeNormativeDiffsIntoArticles(ctx, tx, prIdentity.InternalID, releaseVersion, releaseDate, input.FormalApprovalReference)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return mergePRResponse{}, newServiceError(http.StatusConflict, "PR has no mergeable normative diff")
		}

		return mergePRResponse{}, err
	}
	if len(updatedArticles) == 0 {
		return mergePRResponse{}, newServiceError(http.StatusConflict, "PR has no mergeable normative diff")
	}

	var releaseInternalID string
	err = tx.QueryRow(ctx, `
		INSERT INTO releases (
			version,
			title,
			release_date,
			repository_name,
			changelog,
			incorporated_pr_public_ids,
			affected_articles_count,
			official_document_url,
			promulgated_by
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id::text
	`,
		releaseVersion,
		releaseTitle,
		releaseDate,
		prIdentity.Repository,
		changelog,
		[]string{prIdentity.PublicID},
		len(updatedArticles),
		nullableString(input.OfficialDocumentURL),
		input.PromulgatedBy,
	).Scan(&releaseInternalID)
	if err != nil {
		if isUniqueViolation(err) {
			return mergePRResponse{}, newServiceError(http.StatusConflict, "release version already exists")
		}

		return mergePRResponse{}, err
	}

	if _, err := tx.Exec(ctx, `
		UPDATE civic_prs
		SET status = 'Incorporado ao texto oficial'
		WHERE id = $1::uuid
	`, prIdentity.InternalID); err != nil {
		return mergePRResponse{}, err
	}

	if err := insertAuditEvent(ctx, tx, actor, "pr_merged", "civic_pr", prIdentity.InternalID, prIdentity.PublicID, map[string]any{
		"releaseVersion":          releaseVersion,
		"formalApprovalReference": input.FormalApprovalReference,
		"updatedArticlesCount":    len(updatedArticles),
	}); err != nil {
		return mergePRResponse{}, err
	}

	if err := insertAuditEvent(ctx, tx, actor, "release_created", "release", releaseInternalID, releaseVersion, map[string]any{
		"incorporatedPrId":        prIdentity.PublicID,
		"formalApprovalReference": input.FormalApprovalReference,
	}); err != nil {
		return mergePRResponse{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return mergePRResponse{}, err
	}

	pr, err := r.GetPR(ctx, prIdentity.PublicID)
	if err != nil {
		return mergePRResponse{}, err
	}

	release, err := r.GetRelease(ctx, releaseVersion)
	if err != nil {
		return mergePRResponse{}, err
	}

	return mergePRResponse{
		PR:              pr,
		Release:         release,
		UpdatedArticles: updatedArticles,
	}, nil
}
