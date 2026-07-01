package op

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"codigo-publico/backend/internal/web"

	"github.com/jackc/pgx/v5"
)

// RankingComputer é a interface que o módulo de ranking expõe para computar
// itens a partir de votações resolvidas. Evita importação circular.
type RankingComputer interface {
	ComputeFromVoting(ctx context.Context, citizenID string, votingID, votingPublicID, cycleID, territoryID, territoryName, proposalID, proposalTitle string, votesYes, votesNo, votesAbstain, quorumNeeded, quorumReached int) error
}

type Service struct {
	repo           *Repository
	rankingCompute func(ctx context.Context, citizenID string, data VotingResolutionData) error
	logger         *slog.Logger
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo, logger: slog.Default()}
}

// SetRankingComputer registra a função de callback para computar ranking items
// após o fechamento em lote de votações no AdvanceCycle.
func (s *Service) SetRankingComputer(fn func(ctx context.Context, citizenID string, data VotingResolutionData) error) {
	s.rankingCompute = fn
}

// SetLogger define o logger do service.
func (s *Service) SetLogger(l *slog.Logger) {
	s.logger = l
}

func (s *Service) requireActor(ctx context.Context, citizenID string) (actor, error) {
	a, err := s.repo.actorByID(ctx, citizenID)
	if errors.Is(err, pgx.ErrNoRows) {
		return actor{}, web.NewError(http.StatusUnauthorized, "unknown citizen")
	}
	return a, err
}

// cycleActorFor resolve a autoridade para mover o ciclo: sysadmin (bootstrap) ou
// Maintainer Geral efetivo. Espelha authorityFor do módulo territorial.
func (s *Service) cycleActorFor(ctx context.Context, requester actor) (CycleActor, error) {
	ca := CycleActor{
		IsSysadmin:          isSysadminRole(requester.Role),
		IsGeneralMaintainer: isLegislativeRole(requester.Role),
	}
	if ca.IsSysadmin {
		return ca, nil
	}

	if !ca.IsGeneralMaintainer {
		general, err := s.repo.isGeneralMaintainer(ctx, requester.ID)
		if err != nil {
			return CycleActor{}, err
		}
		ca.IsGeneralMaintainer = general
	}

	return ca, nil
}

// requireGeneralInstance garante que o ator é a instância geral antes de um ato
// institucional (criar, configurar, prever envelope).
func (s *Service) requireGeneralInstance(ctx context.Context, citizenID string) (actor, CycleActor, error) {
	requester, err := s.requireActor(ctx, citizenID)
	if err != nil {
		return actor{}, CycleActor{}, err
	}
	ca, err := s.cycleActorFor(ctx, requester)
	if err != nil {
		return actor{}, CycleActor{}, err
	}
	if !ca.isGeneralInstance() {
		return actor{}, CycleActor{}, web.NewError(http.StatusForbidden, "esta ação exige a instância geral (Maintainer Geral ou sysadmin)")
	}
	return requester, ca, nil
}

// resolveRegimento devolve o regimento informado (validado) ou o default.
func resolveRegimento(override *RegimentoLocal) (RegimentoLocal, error) {
	reg := DefaultRegimento()
	if override != nil {
		reg = *override
	}
	if err := reg.Validate(); err != nil {
		return RegimentoLocal{}, err
	}
	return reg, nil
}

func (s *Service) CreateCycle(ctx context.Context, citizenID string, input createCycleInput) (Cycle, error) {
	requester, _, err := s.requireGeneralInstance(ctx, citizenID)
	if err != nil {
		return Cycle{}, err
	}

	label := strings.TrimSpace(input.Label)
	if label == "" {
		return Cycle{}, web.NewError(http.StatusBadRequest, "label do ciclo é obrigatório")
	}
	if input.EnvelopeTotal < 0 {
		return Cycle{}, web.NewError(http.StatusBadRequest, "envelope não pode ser negativo")
	}

	reg, err := resolveRegimento(input.Regimento)
	if err != nil {
		return Cycle{}, err
	}

	// Se as duas datas vierem já na criação, o calendário precisa caber na LOA.
	if input.StartsAt != nil && input.LOADeadline != nil {
		if _, err := CanScheduleCycle(input.StartsAt.UTC(), reg, input.LOADeadline.UTC()); err != nil {
			return Cycle{}, err
		}
	}

	return s.repo.createCycle(ctx, requester, label, reg, input.EnvelopeTotal, input.StartsAt, input.LOADeadline)
}

func (s *Service) ConfigureCycle(ctx context.Context, citizenID, cycleID string, input configureCycleInput) (Cycle, error) {
	requester, _, err := s.requireGeneralInstance(ctx, citizenID)
	if err != nil {
		return Cycle{}, err
	}

	current, err := s.repo.getCycle(ctx, cycleID)
	if errors.Is(err, pgx.ErrNoRows) {
		return Cycle{}, web.NewError(http.StatusNotFound, "ciclo não encontrado")
	}
	if err != nil {
		return Cycle{}, err
	}
	if err := CanConfigure(current.Phase); err != nil {
		return Cycle{}, err
	}

	label := strings.TrimSpace(input.Label)
	if label == "" {
		label = current.Label
	}
	if input.EnvelopeTotal < 0 {
		return Cycle{}, web.NewError(http.StatusBadRequest, "envelope não pode ser negativo")
	}

	reg, err := resolveRegimento(input.Regimento)
	if err != nil {
		return Cycle{}, err
	}

	if input.StartsAt != nil && input.LOADeadline != nil {
		if _, err := CanScheduleCycle(input.StartsAt.UTC(), reg, input.LOADeadline.UTC()); err != nil {
			return Cycle{}, err
		}
	}

	return s.repo.configureCycle(ctx, requester, cycleID, label, reg, input.EnvelopeTotal, input.StartsAt, input.LOADeadline)
}

// AdvanceCycle move o ciclo para a próxima fase. Abrir o ciclo (sair de Rascunho)
// exige calendário válido contra o prazo da LOA — não se abre um ciclo que não
// cabe no exercício fiscal.
func (s *Service) AdvanceCycle(ctx context.Context, citizenID, cycleID string, input advanceCycleInput) (Cycle, error) {
	requester, ca, err := s.requireGeneralInstance(ctx, citizenID)
	if err != nil {
		return Cycle{}, err
	}

	current, err := s.repo.getCycle(ctx, cycleID)
	if errors.Is(err, pgx.ErrNoRows) {
		return Cycle{}, web.NewError(http.StatusNotFound, "ciclo não encontrado")
	}
	if err != nil {
		return Cycle{}, err
	}

	next, ok := NextPhase(current.Phase)
	if !ok {
		return Cycle{}, web.NewError(http.StatusConflict, "não há próxima fase a partir de "+current.Phase)
	}
	if to := strings.TrimSpace(input.To); to != "" && to != next {
		return Cycle{}, web.NewError(http.StatusConflict, "a próxima fase é "+next+", não "+to)
	}
	if err := ValidateTransition(current.Phase, next, ca); err != nil {
		return Cycle{}, err
	}

	// Abrir o ciclo (Rascunho → Inscrições) exige agenda válida.
	if current.Phase == CyclePhaseDraft {
		if current.StartsAt == nil || current.LOADeadline == nil {
			return Cycle{}, web.NewError(http.StatusUnprocessableEntity, "configure início e prazo da LOA antes de abrir o ciclo")
		}
		start, err1 := time.Parse(time.RFC3339, *current.StartsAt)
		deadline, err2 := time.Parse(time.RFC3339, *current.LOADeadline)
		if err1 != nil || err2 != nil {
			return Cycle{}, web.NewError(http.StatusInternalServerError, "datas do ciclo inválidas")
		}
		if _, err := CanScheduleCycle(start, current.Regimento, deadline); err != nil {
			return Cycle{}, err
		}
	}

	cycle, resolutions, err := s.repo.transitionPhase(ctx, requester, cycleID, current.Phase, next, "op_cycle.advanced", "")
	if err != nil {
		return Cycle{}, err
	}

	// Após commit: computar ranking para cada votação resolvida (best-effort).
	if len(resolutions) > 0 && s.rankingCompute != nil {
		for _, res := range resolutions {
			if err := s.rankingCompute(ctx, requester.ID, res); err != nil {
				s.logger.Warn("ranking computation failed in batch advance", "error", err, "votingId", res.VotingPublicID)
			}
		}

		// Gerar snapshot congelado do resultado do ciclo.
		if err := s.repo.snapshotCycleResult(ctx, cycleID); err != nil {
			s.logger.Warn("cycle result snapshot failed", "error", err, "cycleId", cycleID)
		}
	}

	return cycle, nil
}

func (s *Service) CancelCycle(ctx context.Context, citizenID, cycleID string, input cancelCycleInput) (Cycle, error) {
	requester, ca, err := s.requireGeneralInstance(ctx, citizenID)
	if err != nil {
		return Cycle{}, err
	}

	reason := strings.TrimSpace(input.Reason)
	if reason == "" {
		return Cycle{}, web.NewError(http.StatusBadRequest, "cancelar um ciclo exige justificativa")
	}

	current, err := s.repo.getCycle(ctx, cycleID)
	if errors.Is(err, pgx.ErrNoRows) {
		return Cycle{}, web.NewError(http.StatusNotFound, "ciclo não encontrado")
	}
	if err != nil {
		return Cycle{}, err
	}
	if err := CanCancel(current.Phase, ca); err != nil {
		return Cycle{}, err
	}

	cycle, _, err := s.repo.transitionPhase(ctx, requester, cycleID, current.Phase, CyclePhaseCanceled, "op_cycle.canceled", reason)
	return cycle, err
}

func (s *Service) ListCycles(ctx context.Context) ([]Cycle, error) {
	return s.repo.listCycles(ctx)
}

func (s *Service) GetCycle(ctx context.Context, cycleID string) (Cycle, error) {
	cycle, err := s.repo.getCycle(ctx, cycleID)
	if errors.Is(err, pgx.ErrNoRows) {
		return Cycle{}, web.NewError(http.StatusNotFound, "ciclo não encontrado")
	}
	return cycle, err
}

func (s *Service) ListTerritoryEnvelopes(ctx context.Context, cycleID string) ([]CycleTerritoryEnvelope, error) {
	cycle, err := s.GetCycle(ctx, cycleID)
	if err != nil {
		return nil, err
	}

	return s.repo.listTerritoryEnvelopes(ctx, cycle.ID)
}

func (s *Service) GetCurrentCycle(ctx context.Context) (Cycle, error) {
	cycle, err := s.repo.getCurrentCycle(ctx)
	if errors.Is(err, pgx.ErrNoRows) {
		return Cycle{}, web.NewError(http.StatusNotFound, "nenhum ciclo de OP ativo")
	}
	return cycle, err
}

// PreviewEnvelope calcula a divisão do envelope sem persistir — apoia a UI a
// simular o efeito do regimento e dos pesos de carência antes de fixar o ciclo.
func (s *Service) PreviewEnvelope(ctx context.Context, citizenID string, input previewEnvelopeInput) (EnvelopeSplit, error) {
	if _, _, err := s.requireGeneralInstance(ctx, citizenID); err != nil {
		return EnvelopeSplit{}, err
	}

	reg, err := resolveRegimento(input.Regimento)
	if err != nil {
		return EnvelopeSplit{}, err
	}

	return SplitEnvelope(input.Total, reg, input.Territories)
}

// GetCycleResults retorna o resultado congelado (snapshot) de um ciclo.
// Se o snapshot não existir ainda, retorna um resultado vazio com frozen=false.
func (s *Service) GetCycleResults(ctx context.Context, cycleID string) (*CycleResultSnapshot, error) {
	cycle, err := s.GetCycle(ctx, cycleID)
	if err != nil {
		return nil, err
	}

	snapshot, err := s.repo.getCycleResultSnapshot(ctx, cycle.ID)
	if err != nil {
		return nil, err
	}
	if snapshot != nil {
		return snapshot, nil
	}

	// Sem snapshot congelado: retorna resultado vazio.
	return &CycleResultSnapshot{
		CycleID:    cycle.ID,
		CycleLabel: cycle.Label,
		Frozen:     false,
		Items:      []CycleResultItem{},
	}, nil
}
