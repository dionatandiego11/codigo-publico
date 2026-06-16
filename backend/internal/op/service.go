package op

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"codigo-publico/backend/internal/web"

	"github.com/jackc/pgx/v5"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
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
	ca := CycleActor{IsSysadmin: isSysadminRole(requester.Role)}
	if ca.IsSysadmin {
		return ca, nil
	}

	general, err := s.repo.isGeneralMaintainer(ctx, requester.ID)
	if err != nil {
		return CycleActor{}, err
	}
	ca.IsGeneralMaintainer = general

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

	return s.repo.transitionPhase(ctx, requester, cycleID, current.Phase, next, "op_cycle.advanced", "")
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

	return s.repo.transitionPhase(ctx, requester, cycleID, current.Phase, CyclePhaseCanceled, "op_cycle.canceled", reason)
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
