package publicapi

import (
	"context"
	"net/http"
)

func (s *Service) CastVote(ctx context.Context, identifier string, input voteRequest) (voteResponse, error) {
	actor, err := s.authenticatedCitizen(ctx)
	if err != nil {
		return voteResponse{}, err
	}

	selection, err := normalizeVoteSelection(input)
	if err != nil {
		return voteResponse{}, newServiceError(http.StatusBadRequest, err.Error())
	}

	return s.repo.CastVote(ctx, actor, identifier, selection)
}
