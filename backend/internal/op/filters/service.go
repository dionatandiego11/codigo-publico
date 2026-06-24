package filters

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

func (s *Service) ListFilters(ctx context.Context, input listFiltersInput) ([]BudgetFilter, error) {
	input.CycleID = strings.TrimSpace(input.CycleID)
	input.TerritoryID = strings.TrimSpace(input.TerritoryID)
	input.DemandID = strings.TrimSpace(input.DemandID)

	return s.repo.listFilters(ctx, input)
}

func (s *Service) AppealFilter(ctx context.Context, citizenID, filterID string, input appealInput) (BudgetFilterAppeal, error) {
	a, err := s.repo.actorByID(ctx, strings.TrimSpace(citizenID))
	if isNoRows(err) {
		return BudgetFilterAppeal{}, web.NewError(http.StatusUnauthorized, "cidadão autenticado não encontrado")
	}
	if err != nil {
		return BudgetFilterAppeal{}, err
	}

	reason := strings.TrimSpace(input.Reason)
	if reason == "" {
		return BudgetFilterAppeal{}, web.NewError(http.StatusBadRequest, "recurso exige justificativa")
	}

	filter, err := s.repo.filterRecord(ctx, strings.TrimSpace(filterID))
	if isNoRows(err) {
		return BudgetFilterAppeal{}, web.NewError(http.StatusNotFound, "filtro não encontrado")
	}
	if err != nil {
		return BudgetFilterAppeal{}, err
	}
	if filter.Status == "Em recurso" {
		return BudgetFilterAppeal{}, web.NewError(http.StatusConflict, "este filtro já está em recurso")
	}
	hasAppeal, err := s.repo.filterHasAppeal(ctx, filter.ID)
	if err != nil {
		return BudgetFilterAppeal{}, err
	}
	if hasAppeal {
		return BudgetFilterAppeal{}, web.NewError(http.StatusConflict, "este filtro já possui recurso registrado")
	}

	linked, err := s.repo.citizenLinkedToTerritory(ctx, a.ID, filter.TerritoryID)
	if err != nil {
		return BudgetFilterAppeal{}, err
	}
	if !linked {
		return BudgetFilterAppeal{}, web.NewError(http.StatusForbidden, "recurso exige vínculo com o território do filtro")
	}

	return s.repo.createAppeal(ctx, a, filter, reason)
}

func (s *Service) DecideAppeal(ctx context.Context, citizenID, appealID string, input decideAppealInput) (BudgetFilterAppeal, error) {
	decider, err := s.repo.actorByID(ctx, strings.TrimSpace(citizenID))
	if isNoRows(err) {
		return BudgetFilterAppeal{}, web.NewError(http.StatusUnauthorized, "cidadão autenticado não encontrado")
	}
	if err != nil {
		return BudgetFilterAppeal{}, err
	}

	if !op.IsInstitutionalRole(decider.Role) {
		general, err := s.repo.isGeneralMaintainer(ctx, decider.ID)
		if err != nil {
			return BudgetFilterAppeal{}, err
		}
		if !general {
			return BudgetFilterAppeal{}, web.NewError(http.StatusForbidden, "decidir recurso exige instância geral")
		}
	}

	reason := strings.TrimSpace(input.Reason)
	if reason == "" {
		return BudgetFilterAppeal{}, web.NewError(http.StatusBadRequest, "decisão de recurso exige justificativa")
	}

	appeal, err := s.repo.appealRecord(ctx, strings.TrimSpace(appealID))
	if isNoRows(err) {
		return BudgetFilterAppeal{}, web.NewError(http.StatusNotFound, "recurso não encontrado")
	}
	if err != nil {
		return BudgetFilterAppeal{}, err
	}
	if appeal.Status != "Aberto" {
		return BudgetFilterAppeal{}, web.NewError(http.StatusConflict, "este recurso já foi decidido")
	}

	return s.repo.decideAppeal(ctx, decider, appeal, input.Approve, reason)
}
