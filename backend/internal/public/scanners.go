package publicapi

import (
	"database/sql"
	"time"
)

type scanner interface {
	Scan(dest ...any) error
}

func scanRelease(row scanner) (Release, error) {
	var release Release
	var releaseDate time.Time
	var officialDocumentURL sql.NullString

	if err := row.Scan(
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
		return Release{}, err
	}

	release.Date = formatBrazilianDate(releaseDate)
	release.OfficialDocumentURL = nullStringPtr(officialDocumentURL)
	return release, nil
}

func scanVoting(row scanner) (Voting, string, error) {
	var voting Voting
	var internalID string
	var deadline time.Time

	if err := row.Scan(
		&internalID,
		&voting.ID,
		&voting.Title,
		&voting.CitizenSummary,
		&voting.TextChanges,
		&voting.IntendedImpact,
		&voting.Pros,
		&voting.Cons,
		&voting.ReviewsOverview,
		&deadline,
		&voting.QuorumNeeded,
		&voting.QuorumReached,
		&voting.VotesYes,
		&voting.VotesNo,
		&voting.VotesAbstain,
		&voting.Status,
	); err != nil {
		return Voting{}, "", err
	}

	voting.Deadline = formatDateTime(deadline)
	return voting, internalID, nil
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
