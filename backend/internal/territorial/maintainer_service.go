package territorial

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"codigo-publico/backend/internal/web"

	"github.com/jackc/pgx/v5"
)

// requireSeniorTerritorialCitizen garante que o ator tem vínculo T3+ aprovado no
// território — base da legitimidade para abrir/assinar uma moção de recall.
func (s *Service) requireSeniorTerritorialCitizen(ctx context.Context, citizenID, territoryID string) error {
	bond, err := s.repo.getActiveBondByCitizen(ctx, citizenID)
	if errors.Is(err, pgx.ErrNoRows) {
		return web.NewError(http.StatusForbidden, "recall requires a senior (T3+) approved bond in this territory")
	}
	if err != nil {
		return err
	}
	if bond.Status != BondStatusApproved || bond.TerritoryID != territoryID || !IsSeniorBond(bond.TrustLevel) {
		return web.NewError(http.StatusForbidden, "recall requires a senior (T3+) approved bond in this territory")
	}

	return nil
}

// AppointMaintainer nomeia um maintainer. territoryIdentifier é obrigatório
// para escopo territorial e ignorado para o escopo geral.
func (s *Service) AppointMaintainer(ctx context.Context, citizenID, territoryIdentifier string, input appointMaintainerInput) (Maintainer, error) {
	requester, err := s.requireActor(ctx, citizenID)
	if err != nil {
		return Maintainer{}, err
	}

	scope := strings.TrimSpace(input.Scope)
	if scope == "" {
		scope = ScopeTerritorial
	}

	target := strings.TrimSpace(input.CitizenID)
	if target == "" {
		return Maintainer{}, web.NewError(http.StatusBadRequest, "citizenId is required")
	}

	initialStatus, err := AppointmentInitialStatus(strings.TrimSpace(input.AppointmentSource))
	if err != nil {
		return Maintainer{}, err
	}

	var territoryID string
	if scope == ScopeTerritorial {
		territoryID, _, err = s.repo.resolveTerritory(ctx, strings.TrimSpace(territoryIdentifier))
		if err != nil {
			return Maintainer{}, web.NewError(http.StatusBadRequest, "territory is required for a territorial maintainer")
		}
	}

	authority, err := s.authorityFor(ctx, requester, territoryID)
	if err != nil {
		return Maintainer{}, err
	}
	if err := CanAppoint(scope, authority); err != nil {
		return Maintainer{}, err
	}

	start := time.Now().UTC()
	end := ComputeTermEnd(initialStatus, start)

	return s.repo.appointMaintainer(ctx, requester, territoryID, target, scope,
		strings.TrimSpace(input.AppointmentSource), initialStatus, start, end, strings.TrimSpace(input.MandateNote))
}

func (s *Service) ListMaintainers(ctx context.Context, citizenID, territoryIdentifier string) ([]Maintainer, error) {
	if _, err := s.requireActor(ctx, citizenID); err != nil {
		return nil, err
	}

	territoryID, _, err := s.repo.resolveTerritory(ctx, territoryIdentifier)
	if err != nil {
		return nil, web.NewError(http.StatusNotFound, "territory not found")
	}

	return s.repo.listMaintainers(ctx, territoryID)
}

func (s *Service) ActivateMaintainer(ctx context.Context, citizenID, maintainerID string) (Maintainer, error) {
	requester, err := s.requireActor(ctx, citizenID)
	if err != nil {
		return Maintainer{}, err
	}

	rec, err := s.repo.getMaintainer(ctx, maintainerID)
	if errors.Is(err, pgx.ErrNoRows) {
		return Maintainer{}, web.NewError(http.StatusNotFound, "maintainer not found")
	}
	if err != nil {
		return Maintainer{}, err
	}

	authority, err := s.authorityFor(ctx, requester, rec.TerritoryID)
	if err != nil {
		return Maintainer{}, err
	}
	if err := CanActivate(rec.Status, authority); err != nil {
		return Maintainer{}, err
	}

	// Ratificação concede mandato pleno.
	end := ComputeTermEnd(MaintainerStatusActive, time.Now().UTC())
	return s.repo.transitionMaintainer(ctx, requester, institutionalAuditActor(requester),
		maintainerID, MaintainerStatusProvisional, MaintainerStatusActive, &end, "ratificação", "maintainer.activated")
}

func (s *Service) RenewMandate(ctx context.Context, citizenID, maintainerID string, input renewMandateInput) (Maintainer, error) {
	requester, err := s.requireActor(ctx, citizenID)
	if err != nil {
		return Maintainer{}, err
	}

	reason := strings.TrimSpace(input.Reason)
	if reason == "" {
		return Maintainer{}, web.NewError(http.StatusBadRequest, "mandate renewal requires a public justification")
	}

	rec, err := s.repo.getMaintainer(ctx, maintainerID)
	if errors.Is(err, pgx.ErrNoRows) {
		return Maintainer{}, web.NewError(http.StatusNotFound, "maintainer not found")
	}
	if err != nil {
		return Maintainer{}, err
	}

	authority, err := s.authorityFor(ctx, requester, rec.TerritoryID)
	if err != nil {
		return Maintainer{}, err
	}
	if err := CanRenew(rec.Status, authority); err != nil {
		return Maintainer{}, err
	}

	end := ComputeTermEnd(rec.Status, time.Now().UTC())
	return s.repo.transitionMaintainer(ctx, requester, institutionalAuditActor(requester),
		maintainerID, rec.Status, rec.Status, &end, reason, "maintainer.mandate_renewed")
}

func (s *Service) RemoveMaintainer(ctx context.Context, citizenID, maintainerID string, input removeMaintainerInput) (Maintainer, error) {
	requester, err := s.requireActor(ctx, citizenID)
	if err != nil {
		return Maintainer{}, err
	}

	reason := strings.TrimSpace(input.Reason)
	if reason == "" {
		return Maintainer{}, web.NewError(http.StatusBadRequest, "removal must be reasoned")
	}

	rec, err := s.repo.getMaintainer(ctx, maintainerID)
	if errors.Is(err, pgx.ErrNoRows) {
		return Maintainer{}, web.NewError(http.StatusNotFound, "maintainer not found")
	}
	if err != nil {
		return Maintainer{}, err
	}

	authority, err := s.authorityFor(ctx, requester, rec.TerritoryID)
	if err != nil {
		return Maintainer{}, err
	}
	if err := CanRemoveForCause(rec.Status, authority); err != nil {
		return Maintainer{}, err
	}

	end := time.Now().UTC()
	return s.repo.transitionMaintainer(ctx, requester, institutionalAuditActor(requester),
		maintainerID, "", MaintainerStatusRemoved, &end, reason, "maintainer.removed")
}

func (s *Service) OpenRecall(ctx context.Context, citizenID, maintainerID string, input openRecallInput) (RecallMotion, error) {
	requester, err := s.requireActor(ctx, citizenID)
	if err != nil {
		return RecallMotion{}, err
	}

	reason := strings.TrimSpace(input.Reason)
	if reason == "" {
		return RecallMotion{}, web.NewError(http.StatusBadRequest, "a recall motion requires a justification")
	}

	rec, err := s.repo.getMaintainer(ctx, maintainerID)
	if errors.Is(err, pgx.ErrNoRows) {
		return RecallMotion{}, web.NewError(http.StatusNotFound, "maintainer not found")
	}
	if err != nil {
		return RecallMotion{}, err
	}
	if rec.Scope != ScopeTerritorial {
		return RecallMotion{}, web.NewError(http.StatusBadRequest, "only territorial maintainers can be recalled by the community")
	}
	if err := CanOpenRecall(rec.Status); err != nil {
		return RecallMotion{}, err
	}
	if err := s.requireSeniorTerritorialCitizen(ctx, requester.ID, rec.TerritoryID); err != nil {
		return RecallMotion{}, err
	}

	senior, err := s.repo.countSeniorActiveBonds(ctx, rec.TerritoryID)
	if err != nil {
		return RecallMotion{}, err
	}
	quorum := RecallQuorum(senior)

	return s.repo.openRecall(ctx, requester, maintainerID, rec.TerritoryID, reason, quorum)
}

func (s *Service) SignRecall(ctx context.Context, citizenID, motionID string) (RecallMotion, error) {
	requester, err := s.requireActor(ctx, citizenID)
	if err != nil {
		return RecallMotion{}, err
	}

	rec, err := s.repo.getRecall(ctx, motionID)
	if errors.Is(err, pgx.ErrNoRows) {
		return RecallMotion{}, web.NewError(http.StatusNotFound, "recall motion not found")
	}
	if err != nil {
		return RecallMotion{}, err
	}
	if rec.Status != RecallStatusOpen {
		return RecallMotion{}, web.NewError(http.StatusConflict, "this recall motion is no longer open")
	}
	if err := s.requireSeniorTerritorialCitizen(ctx, requester.ID, rec.TerritoryID); err != nil {
		return RecallMotion{}, err
	}

	return s.repo.signRecall(ctx, requester, rec)
}
