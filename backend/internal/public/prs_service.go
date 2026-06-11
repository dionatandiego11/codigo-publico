package publicapi

import (
	"context"
	"net/http"
	"strings"
)

func (s *Service) CreatePR(ctx context.Context, input createPRRequest) (CivicPR, error) {
	actor, err := s.authenticatedCitizen(ctx)
	if err != nil {
		return CivicPR{}, err
	}

	input.Title = strings.TrimSpace(input.Title)
	input.Repository = strings.TrimSpace(input.Repository)
	input.TargetTitle = strings.TrimSpace(input.TargetTitle)
	input.AffectedArticles = strings.TrimSpace(input.AffectedArticles)
	input.AuthorType = strings.TrimSpace(input.AuthorType)
	input.CitizenSummary = strings.TrimSpace(input.CitizenSummary)
	input.Justification = strings.TrimSpace(input.Justification)
	if input.Title == "" || input.Repository == "" || input.CitizenSummary == "" || input.Justification == "" {
		return CivicPR{}, newServiceError(http.StatusBadRequest, "title, repository, citizenSummary and justification are required")
	}
	if input.TargetTitle == "" {
		input.TargetTitle = "Geral"
	}
	if input.AffectedArticles == "" {
		input.AffectedArticles = "Artigos diversos"
	}
	if input.AuthorType == "" {
		input.AuthorType = prAuthorTypePopularInitiative
	}
	if !isAllowedPRAuthorType(input.AuthorType) {
		return CivicPR{}, newServiceError(http.StatusBadRequest, "authorType is not a valid civic PR author type")
	}
	input.LinkedIssueIDs = cleanStringList(input.LinkedIssueIDs)

	return s.repo.CreatePR(ctx, actor, input)
}

func (s *Service) GetPRAllowedTransitions(ctx context.Context, identifier string) (PRAllowedTransitionsResponse, error) {
	actor, err := s.authenticatedCitizen(ctx)
	if err != nil {
		return PRAllowedTransitionsResponse{}, err
	}

	return s.repo.GetPRAllowedTransitions(ctx, actor, identifier, s.stateMachine)
}

func (s *Service) CreatePRComment(ctx context.Context, identifier string, input createCommentRequest) (PRComment, error) {
	actor, err := s.authenticatedCitizen(ctx)
	if err != nil {
		return PRComment{}, err
	}

	input.Content = strings.TrimSpace(input.Content)
	if input.Content == "" {
		return PRComment{}, newServiceError(http.StatusBadRequest, "content is required")
	}

	return s.repo.CreatePRComment(ctx, actor, identifier, input)
}

func (s *Service) UpvotePR(ctx context.Context, identifier string) (CivicPR, error) {
	actor, err := s.authenticatedCitizen(ctx)
	if err != nil {
		return CivicPR{}, err
	}

	return s.repo.UpvotePR(ctx, actor, identifier)
}

func (s *Service) MergePR(ctx context.Context, identifier string, input mergePRRequest) (mergePRResponse, error) {
	actor, err := s.authenticatedCitizen(ctx)
	if err != nil {
		return mergePRResponse{}, err
	}
	if !isInstitutionalRole(actor.Role) {
		return mergePRResponse{}, newServiceError(http.StatusForbidden, "merge institucional exige papel institucional")
	}

	input.PromulgatedBy = strings.TrimSpace(input.PromulgatedBy)
	input.FormalApprovalReference = strings.TrimSpace(input.FormalApprovalReference)
	if input.PromulgatedBy == "" || input.FormalApprovalReference == "" {
		return mergePRResponse{}, newServiceError(http.StatusBadRequest, "promulgatedBy and formalApprovalReference are required")
	}

	releaseDate, err := parseOptionalDate(input.ReleaseDate)
	if err != nil {
		return mergePRResponse{}, newServiceError(http.StatusBadRequest, "releaseDate must use YYYY-MM-DD")
	}

	return s.repo.MergePR(ctx, actor, identifier, input, releaseDate)
}
