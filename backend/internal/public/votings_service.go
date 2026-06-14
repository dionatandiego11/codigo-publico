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

// CloseExpiredVotings encerra todas as votações vencidas e resolve os PRs
// vinculados. Operação de sistema (usada pelo job em background); erros por item
// não abortam o lote.
func (s *Service) CloseExpiredVotings(ctx context.Context) (int, error) {
	ids, err := s.repo.expiredOpenVotingIDs(ctx)
	if err != nil {
		return 0, err
	}

	closed := 0
	var firstErr error
	for _, id := range ids {
		if err := s.repo.closeExpiredVoting(ctx, id, s.stateMachine); err != nil {
			if firstErr == nil {
				firstErr = err
			}
			continue
		}
		closed++
	}

	return closed, firstErr
}

// CloseExpiredVotingsByAdmin é o gatilho manual, restrito a papel institucional.
func (s *Service) CloseExpiredVotingsByAdmin(ctx context.Context) (int, error) {
	actor, err := s.authenticatedCitizen(ctx)
	if err != nil {
		return 0, err
	}
	if !isInstitutionalRole(actor.Role) {
		return 0, newServiceError(http.StatusForbidden, "closing votings requires an institutional role")
	}

	return s.CloseExpiredVotings(ctx)
}
