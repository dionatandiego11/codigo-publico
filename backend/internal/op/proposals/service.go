package proposals

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"codigo-publico/backend/internal/op"
	"codigo-publico/backend/internal/web"

	"github.com/jackc/pgx/v5"
)

const demandReadyForPrioritization = "Apta para priorização"

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) ListProposals(ctx context.Context) ([]Proposal, error) {
	return s.repo.listProposals(ctx)
}

func (s *Service) ListProposalsByTerritory(ctx context.Context, territoryID string) ([]Proposal, error) {
	return s.repo.listProposalsByTerritory(ctx, strings.TrimSpace(territoryID))
}

func (s *Service) GetProposal(ctx context.Context, identifier string) (Proposal, error) {
	proposal, err := s.repo.getProposal(ctx, strings.TrimSpace(identifier))
	if errors.Is(err, pgx.ErrNoRows) {
		return Proposal{}, web.NewError(http.StatusNotFound, "proposta não encontrada")
	}
	return proposal, err
}

func (s *Service) CreateProposalFromDemand(ctx context.Context, citizenID string, demandID string, input createProposalInput) (Proposal, error) {
	a, err := s.requireActor(ctx, citizenID)
	if err != nil {
		return Proposal{}, err
	}

	demand, err := s.repo.demandRecord(ctx, strings.TrimSpace(demandID))
	if errors.Is(err, pgx.ErrNoRows) {
		return Proposal{}, web.NewError(http.StatusNotFound, "demanda não encontrada")
	}
	if err != nil {
		return Proposal{}, err
	}
	if demand.Status != demandReadyForPrioritization {
		return Proposal{}, web.NewError(http.StatusConflict, "somente demanda apta para priorização pode virar proposta")
	}

	if !op.IsInstitutionalRole(a.Role) {
		allowed, err := s.repo.hasProposalAuthority(ctx, a, demand.TerritoryID)
		if err != nil {
			return Proposal{}, err
		}
		if !allowed {
			return Proposal{}, web.NewError(http.StatusForbidden, "criar proposta exige instância territorial ou geral")
		}
	}

	input = normalizeProposalInput(input, demand)
	if input.Title == "" {
		return Proposal{}, web.NewError(http.StatusBadRequest, "title é obrigatório")
	}
	if input.SolutionScope == "" {
		return Proposal{}, web.NewError(http.StatusBadRequest, "solutionScope é obrigatório")
	}
	if input.EstimatedCostCents <= 0 {
		return Proposal{}, web.NewError(http.StatusBadRequest, "estimatedCostCents deve ser maior que zero")
	}
	if input.Category == "" {
		return Proposal{}, web.NewError(http.StatusBadRequest, "category é obrigatório")
	}

	// Circuit breaker jurídico-orçamentário (PROTOCOLO-OP §13): a proposta só é
	// admitida se passar no filtro. A dimensão orçamentária é aferida contra o
	// sub-envelope congelado do território no ciclo.
	budget, err := s.repo.territoryEnvelope(ctx, demand.CycleID, demand.TerritoryID)
	if err != nil {
		return Proposal{}, err
	}
	breaker := op.EvaluateCircuitBreaker(op.ProposalFacts{
		EstimatedCostCents:  input.EstimatedCostCents,
		AvailableCents:      budget,
		MunicipalCompetence: true,
		Legal:               true,
		HasFundingSource:    true,
	})
	if !breaker.Passes {
		if err := s.repo.recordBudgetFilter(ctx, a, demand, input, breaker, budget); err != nil {
			return Proposal{}, err
		}
		return Proposal{}, web.NewError(http.StatusUnprocessableEntity, breaker.Message)
	}

	return s.repo.createProposal(ctx, a, demand, input)
}

func (s *Service) requireActor(ctx context.Context, citizenID string) (actor, error) {
	a, err := s.repo.actorByID(ctx, citizenID)
	if errors.Is(err, pgx.ErrNoRows) {
		return actor{}, web.NewError(http.StatusUnauthorized, "cidadão autenticado não encontrado")
	}
	return a, err
}

func normalizeProposalInput(input createProposalInput, demand demandRecord) createProposalInput {
	input.Title = strings.TrimSpace(input.Title)
	input.ProblemSummary = strings.TrimSpace(input.ProblemSummary)
	input.SolutionScope = strings.TrimSpace(input.SolutionScope)
	input.Category = strings.TrimSpace(input.Category)

	if input.Title == "" {
		input.Title = demand.Title
	}
	if input.ProblemSummary == "" {
		input.ProblemSummary = demand.Description
	}
	if input.Category == "" {
		input.Category = demand.Category
	}

	return input
}
