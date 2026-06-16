package institutional

import (
	"context"
	"net/http"
	"strings"

	"codigo-publico/backend/internal/op"
	"codigo-publico/backend/internal/web"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) requireActor(ctx context.Context, citizenID string) (actor, error) {
	a, err := s.repo.actorByID(ctx, citizenID)
	if isNoRows(err) {
		return actor{}, web.NewError(http.StatusUnauthorized, "cidadão autenticado não encontrado")
	}
	return a, err
}

// requireGeneralInstance: o filtro institucional é exercido pelo Legislativo —
// papéis institucionais (vereador, mesa, legislativo, admin) ou o Maintainer
// Geral efetivo.
func (s *Service) requireGeneralInstance(ctx context.Context, citizenID string) (actor, error) {
	a, err := s.requireActor(ctx, citizenID)
	if err != nil {
		return actor{}, err
	}
	if op.IsInstitutionalRole(a.Role) {
		return a, nil
	}
	general, err := s.repo.isGeneralMaintainer(ctx, a.ID)
	if err != nil {
		return actor{}, err
	}
	if !general {
		return actor{}, web.NewError(http.StatusForbidden, "o filtro institucional exige a instância geral (Legislativo/Maintainer Geral)")
	}
	return a, nil
}

// DecideInstitutional aplica o filtro institucional (PROTOCOLO-OP §8) sobre uma
// proposta priorizada pela votação popular: admite na matriz, filtra por
// fundamento formal (retorno) ou registra veto político (incidente público).
func (s *Service) DecideInstitutional(ctx context.Context, citizenID, proposalID string, input institutionalDecisionInput) (DecisionResult, error) {
	decider, err := s.requireGeneralInstance(ctx, citizenID)
	if err != nil {
		return DecisionResult{}, err
	}

	proposal, err := s.repo.proposalForReview(ctx, strings.TrimSpace(proposalID))
	if isNoRows(err) {
		return DecisionResult{}, web.NewError(http.StatusNotFound, "proposta não encontrada")
	}
	if err != nil {
		return DecisionResult{}, err
	}
	if proposal.Status != statusPrioritized {
		return DecisionResult{}, web.NewError(http.StatusConflict, "só uma proposta priorizada pela votação pode passar pelo filtro institucional")
	}

	ground := op.InstitutionalGround(strings.TrimSpace(input.Ground))
	reason := strings.TrimSpace(input.Reason)

	res, err := op.ClassifyInstitutionalDecision(op.InstitutionalDecision{
		Approve: input.Approve,
		Ground:  ground,
		Reason:  reason,
	})
	if err != nil {
		return DecisionResult{}, err
	}

	return s.repo.applyInstitutionalDecision(ctx, decider, proposal, res, string(ground), reason)
}

func (s *Service) ListIncidents(ctx context.Context) ([]Incident, error) {
	return s.repo.listIncidents(ctx)
}
