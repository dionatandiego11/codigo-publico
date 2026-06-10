package publicapi

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

func findPRForMerge(ctx context.Context, tx pgx.Tx, identifier string) (prMergeIdentity, error) {
	var pr prMergeIdentity
	err := tx.QueryRow(ctx, `
		SELECT id::text, public_id, title, repository, status
		FROM civic_prs
		WHERE id::text = $1 OR public_id = $1
		FOR UPDATE
	`, identifier).Scan(&pr.InternalID, &pr.PublicID, &pr.Title, &pr.Repository, &pr.Status)
	if err != nil {
		return prMergeIdentity{}, err
	}

	return pr, nil
}

func nextReleaseVersion(ctx context.Context, tx pgx.Tx, releaseDate time.Time) (string, error) {
	if _, err := tx.Exec(ctx, "SELECT pg_advisory_xact_lock($1)", int64(2026061004)); err != nil {
		return "", err
	}

	versionPattern := fmt.Sprintf("^v%d\\.([0-9]+)$", releaseDate.Year())
	versionFilter := fmt.Sprintf("^v%d\\.[0-9]+$", releaseDate.Year())
	var nextNumber int
	if err := tx.QueryRow(ctx, `
		SELECT COALESCE(MAX(substring(version from $1)::int), 0) + 1
		FROM releases
		WHERE version ~ $2
	`, versionPattern, versionFilter).Scan(&nextNumber); err != nil {
		return "", err
	}

	return fmt.Sprintf("v%d.%d", releaseDate.Year(), nextNumber), nil
}

func mergeNormativeDiffsIntoArticles(ctx context.Context, tx pgx.Tx, civicPRID string, releaseVersion string, releaseDate time.Time, amendmentNote string) ([]mergedArticle, []string, error) {
	rows, err := tx.Query(ctx, `
		SELECT
			nd.id::text,
			nd.article_id::text,
			nd.article_number,
			nd.title_ref,
			nd.after_text
		FROM normative_diffs nd
		WHERE nd.civic_pr_id = $1::uuid
		ORDER BY nd.sort_order ASC, nd.article_number ASC
	`, civicPRID)
	if err != nil {
		return nil, nil, err
	}

	diffs := make([]normativeDiffToMerge, 0)
	for rows.Next() {
		var diff normativeDiffToMerge

		if err := rows.Scan(&diff.ID, &diff.ArticleID, &diff.ArticleNumber, &diff.TitleRef, &diff.AfterText); err != nil {
			rows.Close()
			return nil, nil, err
		}

		diffs = append(diffs, diff)
	}

	if err := rows.Err(); err != nil {
		rows.Close()
		return nil, nil, err
	}
	rows.Close()

	updatedArticles := make([]mergedArticle, 0, len(diffs))
	changelog := make([]string, 0, len(diffs))
	for _, diff := range diffs {
		article, err := updateArticleFromDiff(ctx, tx, diff.ArticleID, diff.ArticleNumber, diff.AfterText, releaseVersion, releaseDate, amendmentNote)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return nil, nil, fmt.Errorf("%w: normative diff %s references article %d, but no matching article exists", pgx.ErrNoRows, diff.ID, diff.ArticleNumber)
			}

			return nil, nil, err
		}

		updatedArticles = append(updatedArticles, article)
		changelog = append(changelog, fmt.Sprintf("Atualizado Art. %d — %s", article.Number, diff.TitleRef))
	}

	if len(updatedArticles) == 0 {
		return nil, nil, pgx.ErrNoRows
	}

	return updatedArticles, changelog, nil
}

func updateArticleFromDiff(ctx context.Context, tx pgx.Tx, articleIDValue sql.NullString, articleNumber int, afterText string, releaseVersion string, releaseDate time.Time, amendmentNote string) (mergedArticle, error) {
	var article mergedArticle
	var id string
	var lastUpdated time.Time

	if articleIDValue.Valid {
		err := tx.QueryRow(ctx, `
			UPDATE law_articles
			SET content = $1,
				version = $2,
				last_updated = $3,
				amendment_number = $4
			WHERE id = $5::uuid
			RETURNING id::text, article_number, title, version, last_updated
		`, afterText, releaseVersion, releaseDate, amendmentNote, articleIDValue.String).Scan(&id, &article.Number, &article.Title, &article.Version, &lastUpdated)
		if err != nil {
			return mergedArticle{}, err
		}
	} else {
		err := tx.QueryRow(ctx, `
			UPDATE law_articles
			SET content = $1,
				version = $2,
				last_updated = $3,
				amendment_number = $4
			WHERE article_number = $5
			RETURNING id::text, article_number, title, version, last_updated
		`, afterText, releaseVersion, releaseDate, amendmentNote, articleNumber).Scan(&id, &article.Number, &article.Title, &article.Version, &lastUpdated)
		if err != nil {
			return mergedArticle{}, err
		}
	}

	article.ID = articleID(article.Number)
	article.LastUpdated = formatBrazilianDate(lastUpdated)
	article.AmendmentNote = amendmentNote
	_ = id
	return article, nil
}

func (r *Repository) insertNormativeDiffs(ctx context.Context, tx pgx.Tx, civicPRID string, diffs []NormativeDiff) error {
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
