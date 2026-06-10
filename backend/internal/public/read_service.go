package publicapi

import "context"

func (s *Service) ListTerritories(ctx context.Context) ([]Territory, error) {
	return s.repo.ListTerritories(ctx)
}

func (s *Service) GetTerritory(ctx context.Context, identifier string) (Territory, error) {
	return s.repo.GetTerritory(ctx, identifier)
}

func (s *Service) ListLawArticles(ctx context.Context) ([]LawArticle, error) {
	return s.repo.ListLawArticles(ctx)
}

func (s *Service) GetLawArticle(ctx context.Context, identifier string) (LawArticle, error) {
	return s.repo.GetLawArticle(ctx, identifier)
}

func (s *Service) ListIssues(ctx context.Context) ([]Issue, error) {
	return s.repo.ListIssues(ctx)
}

func (s *Service) GetIssue(ctx context.Context, identifier string) (Issue, error) {
	return s.repo.GetIssue(ctx, identifier)
}

func (s *Service) ListPRs(ctx context.Context) ([]CivicPR, error) {
	return s.repo.ListPRs(ctx)
}

func (s *Service) GetPR(ctx context.Context, identifier string) (CivicPR, error) {
	return s.repo.GetPR(ctx, identifier)
}

func (s *Service) GetPRDiff(ctx context.Context, identifier string) ([]NormativeDiff, error) {
	return s.repo.GetPRDiff(ctx, identifier)
}

func (s *Service) GetPRReviews(ctx context.Context, identifier string) ([]PRReview, error) {
	return s.repo.GetPRReviews(ctx, identifier)
}

func (s *Service) GetPRChecks(ctx context.Context, identifier string) ([]InstitutionalCheck, error) {
	return s.repo.GetPRChecks(ctx, identifier)
}

func (s *Service) ListVotings(ctx context.Context) ([]Voting, error) {
	return s.repo.ListVotings(ctx)
}

func (s *Service) GetVoting(ctx context.Context, identifier string) (Voting, error) {
	return s.repo.GetVoting(ctx, identifier)
}

func (s *Service) GetVotingResults(ctx context.Context, identifier string) (VotingResults, error) {
	voting, err := s.repo.GetVoting(ctx, identifier)
	if err != nil {
		return VotingResults{}, err
	}

	return buildVotingResults(voting), nil
}

func (s *Service) ListReleases(ctx context.Context) ([]Release, error) {
	return s.repo.ListReleases(ctx)
}

func (s *Service) GetRelease(ctx context.Context, identifier string) (Release, error) {
	return s.repo.GetRelease(ctx, identifier)
}

func (s *Service) ListExecutions(ctx context.Context) ([]ExecutionTracker, error) {
	return s.repo.ListExecutions(ctx)
}

func (s *Service) GetPublicStats(ctx context.Context) (PublicStats, error) {
	return s.repo.GetPublicStats(ctx)
}
