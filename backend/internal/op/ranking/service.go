package ranking

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"codigo-publico/backend/internal/op"
	"codigo-publico/backend/internal/web"

	"github.com/jackc/pgx/v5"
)

// validStatuses são os status de execução válidos para atualização.
var validStatuses = map[string]bool{
	"Computado":          true,
	"Incluído na matriz": true,
	"Em execução":        true,
	"Concluído":          true,
	"Frustrado":          true,
}

// Service contém a lógica de negócio do ranking do OP.
type Service struct {
	repo *Repository
}

// NewService cria um serviço de ranking.
func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func hasGeneralInstitutionalRole(role string) bool {
	return op.IsInstitutionalRole(role)
}

// ListByCycle lista todos os itens de ranking de um ciclo, opcionalmente
// filtrados por território.
func (s *Service) ListByCycle(ctx context.Context, cycleID, territoryID string) ([]RankingItem, error) {
	cycleID = strings.TrimSpace(cycleID)
	if cycleID == "" {
		return nil, web.NewError(http.StatusBadRequest, "cycleId é obrigatório")
	}

	territoryID = strings.TrimSpace(territoryID)
	if territoryID != "" {
		return s.repo.listByTerritory(ctx, cycleID, territoryID)
	}
	return s.repo.listByCycle(ctx, cycleID)
}

// ComputeFromVoting cria/atualiza o item de ranking a partir de uma votação
// encerrada. Chamado automaticamente pelo service de votação ao encerrar.
func (s *Service) ComputeFromVoting(ctx context.Context, citizenID string, v resolvedVoting) (RankingItem, error) {
	a, err := s.repo.actorByID(ctx, citizenID)
	if errors.Is(err, pgx.ErrNoRows) {
		return RankingItem{}, web.NewError(http.StatusUnauthorized, "cidadão não encontrado")
	}
	if err != nil {
		return RankingItem{}, err
	}
	return s.repo.upsertFromVoting(ctx, a, v)
}

func (s *Service) requireGeneralInstance(ctx context.Context, citizenID string) (actor, error) {
	a, err := s.repo.actorByID(ctx, citizenID)
	if errors.Is(err, pgx.ErrNoRows) {
		return actor{}, web.NewError(http.StatusUnauthorized, "cidadão não encontrado")
	}
	if err != nil {
		return actor{}, err
	}

	if hasGeneralInstitutionalRole(a.Role) {
		return a, nil
	}

	allowed, err := s.repo.isGeneralMaintainer(ctx, a.ID)
	if err != nil {
		return actor{}, err
	}
	if !allowed {
		return actor{}, web.NewError(http.StatusForbidden, "alterar execução exige a instância geral (Maintainer Geral ou administrador)")
	}

	return a, nil
}

// UpdateStatus muda o status de execução de um item de ranking.
// Exige instância geral (Maintainer Geral ou sysadmin).
func (s *Service) UpdateStatus(ctx context.Context, citizenID, itemID string, input updateStatusInput) (RankingItem, error) {
	a, err := s.requireGeneralInstance(ctx, citizenID)
	if err != nil {
		return RankingItem{}, err
	}

	status := strings.TrimSpace(input.Status)
	if !validStatuses[status] {
		return RankingItem{}, web.NewError(http.StatusBadRequest, "status inválido: "+status)
	}

	if status == "Frustrado" && strings.TrimSpace(input.Reason) == "" {
		return RankingItem{}, web.NewError(http.StatusBadRequest, "frustração exige justificativa pública")
	}

	return s.repo.updateStatus(ctx, a, strings.TrimSpace(itemID), status, strings.TrimSpace(input.Reason))
}

// ResolvedVoting cria uma struct resolvedVoting a partir dos dados exportáveis.
// Facilita a chamada pelo módulo de votações sem importar tipos internos.
func ResolvedVoting(votingID, votingPublicID, cycleID, territoryID, territoryName, proposalID, proposalTitle string,
	votesYes, votesNo, votesAbstain, quorumNeeded, quorumReached int) resolvedVoting {
	return resolvedVoting{
		VotingID:       votingID,
		VotingPublicID: votingPublicID,
		CycleID:        cycleID,
		TerritoryID:    territoryID,
		TerritoryName:  territoryName,
		ProposalID:     proposalID,
		ProposalTitle:  proposalTitle,
		VotesYes:       votesYes,
		VotesNo:        votesNo,
		VotesAbstain:   votesAbstain,
		QuorumNeeded:   quorumNeeded,
		QuorumReached:  quorumReached,
	}
}
