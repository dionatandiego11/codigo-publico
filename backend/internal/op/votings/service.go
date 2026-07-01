package votings

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"codigo-publico/backend/internal/op"
	"codigo-publico/backend/internal/web"

	"github.com/jackc/pgx/v5"
)

// ResolvedVotingData é o payload passado ao callback OnResolve com os dados
// necessários para computar o ranking.
type ResolvedVotingData struct {
	CitizenID      string
	VotingID       string
	VotingPublicID string
	CycleID        string
	TerritoryID    string
	TerritoryName  string
	ProposalID     string
	ProposalTitle  string
	VotesYes       int
	VotesNo        int
	VotesAbstain   int
	QuorumNeeded   int
	QuorumReached  int
}

// proposalReadyForVoting é o status (vocabulário de proposta) que habilita abrir
// a votação. A FASE do ciclo, ao contrário, vem da fonte canônica via op.VotingOpen.
const proposalReadyForVoting = "Apta para votação"

// OnResolveFunc é o tipo do callback chamado quando uma votação é encerrada.
type OnResolveFunc func(ctx context.Context, data ResolvedVotingData)

type Service struct {
	repo      *Repository
	onResolve OnResolveFunc
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// SetOnResolve registra um callback que será chamado após o encerramento de
// uma votação. Usado pelo módulo de ranking.
func (s *Service) SetOnResolve(fn OnResolveFunc) {
	s.onResolve = fn
}

func (s *Service) ListVotings(ctx context.Context) ([]Voting, error) {
	return s.repo.listVotings(ctx)
}

func (s *Service) ListVotingsByTerritory(ctx context.Context, territoryID string) ([]Voting, error) {
	return s.repo.listVotingsByTerritory(ctx, strings.TrimSpace(territoryID))
}

func (s *Service) GetVoting(ctx context.Context, identifier string) (Voting, error) {
	voting, err := s.repo.getVoting(ctx, strings.TrimSpace(identifier))
	if errors.Is(err, pgx.ErrNoRows) {
		return Voting{}, web.NewError(http.StatusNotFound, "votação não encontrada")
	}
	return voting, err
}

func (s *Service) GetResults(ctx context.Context, identifier string) (Results, error) {
	voting, err := s.GetVoting(ctx, identifier)
	if err != nil {
		return Results{}, err
	}
	return buildResults(voting), nil
}

func (s *Service) OpenVoting(ctx context.Context, citizenID string, proposalID string) (Voting, error) {
	a, err := s.requireActor(ctx, citizenID)
	if err != nil {
		return Voting{}, err
	}

	proposal, err := s.repo.proposalRecord(ctx, strings.TrimSpace(proposalID))
	if errors.Is(err, pgx.ErrNoRows) {
		return Voting{}, web.NewError(http.StatusNotFound, "proposta não encontrada")
	}
	if err != nil {
		return Voting{}, err
	}
	if proposal.Status != proposalReadyForVoting {
		return Voting{}, web.NewError(http.StatusConflict, "somente proposta apta pode abrir votação")
	}
	if !op.VotingOpen(proposal.CyclePhase) {
		return Voting{}, web.NewError(http.StatusConflict, "o ciclo do OP precisa estar na fase de votação")
	}

	if !op.IsInstitutionalRole(a.Role) {
		allowed, err := s.repo.hasVotingAuthority(ctx, a, proposal.TerritoryID)
		if err != nil {
			return Voting{}, err
		}
		if !allowed {
			return Voting{}, web.NewError(http.StatusForbidden, "abrir votação exige instância territorial ou geral")
		}
	}

	return s.repo.openVoting(ctx, a, proposal)
}

// ResolveVoting encerra a votação e resolve a proposta. Ato da instância que
// conduz o território (territorial/geral) ou institucional.
// Após encerrar, chama o callback OnResolve para que o ranking seja computado.
func (s *Service) ResolveVoting(ctx context.Context, citizenID string, votingID string) (Voting, error) {
	a, err := s.requireActor(ctx, citizenID)
	if err != nil {
		return Voting{}, err
	}

	voting, err := s.repo.getVoting(ctx, strings.TrimSpace(votingID))
	if errors.Is(err, pgx.ErrNoRows) {
		return Voting{}, web.NewError(http.StatusNotFound, "votação não encontrada")
	}
	if err != nil {
		return Voting{}, err
	}

	if !op.IsInstitutionalRole(a.Role) {
		allowed, err := s.repo.hasVotingAuthority(ctx, a, voting.TerritoryID)
		if err != nil {
			return Voting{}, err
		}
		if !allowed {
			return Voting{}, web.NewError(http.StatusForbidden, "encerrar votação exige instância territorial ou geral")
		}
	}

	resolutionData, err := s.repo.rankingResolutionData(ctx, voting.ID)
	if err != nil {
		return Voting{}, err
	}

	resolved, err := s.repo.resolveVoting(ctx, a, voting.ID)
	if err != nil {
		return Voting{}, err
	}

	// Callback para computar ranking automaticamente.
	if s.onResolve != nil {
		resolutionData.CitizenID = citizenID
		resolutionData.VotesYes = resolved.VotesYes
		resolutionData.VotesNo = resolved.VotesNo
		resolutionData.VotesAbstain = resolved.VotesAbstain
		resolutionData.QuorumNeeded = resolved.QuorumNeeded
		resolutionData.QuorumReached = resolved.QuorumReached
		// Ranking é best-effort: falha no ranking não desfaz a votação.
		s.onResolve(ctx, resolutionData)
	}

	return resolved, nil
}

func (s *Service) CastVote(ctx context.Context, citizenID string, votingID string, input voteRequest) (voteResponse, error) {
	a, err := s.requireActor(ctx, citizenID)
	if err != nil {
		return voteResponse{}, err
	}

	selection, err := normalizeVoteSelection(input)
	if err != nil {
		return voteResponse{}, web.NewError(http.StatusBadRequest, err.Error())
	}

	return s.repo.castVote(ctx, a, strings.TrimSpace(votingID), selection)
}

func (s *Service) requireActor(ctx context.Context, citizenID string) (actor, error) {
	a, err := s.repo.actorByID(ctx, citizenID)
	if errors.Is(err, pgx.ErrNoRows) {
		return actor{}, web.NewError(http.StatusUnauthorized, "cidadão autenticado não encontrado")
	}
	return a, err
}

func normalizeVoteSelection(input voteRequest) (string, error) {
	selection := strings.TrimSpace(input.Selection)
	if selection == "" {
		selection = strings.TrimSpace(input.Vote)
	}

	switch selection {
	case "Aprovo", "Rejeito", "Abstenção":
		return selection, nil
	default:
		return "", errors.New("opção de voto deve ser Aprovo, Rejeito ou Abstenção")
	}
}
