package publicapi

import (
	"context"
	"net/http"
	"strings"
)

func (s *Service) CreateIssue(ctx context.Context, input createIssueRequest) (Issue, error) {
	actor, err := s.authenticatedCitizen(ctx)
	if err != nil {
		return Issue{}, err
	}

	input.Title = strings.TrimSpace(input.Title)
	input.Type = strings.TrimSpace(input.Type)
	input.Theme = strings.TrimSpace(input.Theme)
	input.Description = strings.TrimSpace(input.Description)
	if input.Title == "" || input.Type == "" || input.Theme == "" || input.Description == "" {
		return Issue{}, newServiceError(http.StatusBadRequest, "title, type, theme and description are required")
	}
	if !isAllowedIssueType(input.Type) {
		return Issue{}, newServiceError(http.StatusBadRequest, "type is not a valid issue type")
	}

	territoryID, territoryName, err := s.repo.resolveIssueTerritory(ctx, input.TerritoryID, input.Territory)
	if err != nil {
		return Issue{}, newServiceError(http.StatusBadRequest, "territory was not found")
	}

	relatedArticleID, err := s.repo.resolveArticleInternalID(ctx, input.RelatedArticleID)
	if err != nil {
		return Issue{}, newServiceError(http.StatusBadRequest, "relatedArticleId was not found")
	}

	return s.repo.CreateIssue(ctx, actor, input, territoryID, territoryName, relatedArticleID)
}

func (s *Service) CreateIssueComment(ctx context.Context, identifier string, input createCommentRequest) (IssueComment, error) {
	actor, err := s.authenticatedCitizen(ctx)
	if err != nil {
		return IssueComment{}, err
	}

	input.Content = strings.TrimSpace(input.Content)
	if input.Content == "" {
		return IssueComment{}, newServiceError(http.StatusBadRequest, "content is required")
	}

	return s.repo.CreateIssueComment(ctx, actor, identifier, input)
}

func (s *Service) UpvoteIssue(ctx context.Context, identifier string) (Issue, error) {
	actor, err := s.authenticatedCitizen(ctx)
	if err != nil {
		return Issue{}, err
	}

	return s.repo.UpvoteIssue(ctx, actor, identifier)
}

func (s *Service) authenticatedCitizen(ctx context.Context) (citizenActor, error) {
	actor, err := s.repo.authenticatedCitizen(ctx)
	if err != nil {
		return citizenActor{}, newServiceError(http.StatusUnauthorized, "missing authenticated citizen")
	}

	return actor, nil
}
