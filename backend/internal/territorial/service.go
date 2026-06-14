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

// Service orquestra a governança territorial: resolve os fatos no repositório,
// delega as decisões à camada de política pura (policy.go) e persiste o
// resultado. As regras institucionais vivem na policy; aqui ficam apenas a
// coordenação e o acesso a dados.
type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) requireActor(ctx context.Context, citizenID string) (actor, error) {
	requester, err := s.repo.actorByID(ctx, citizenID)
	if err != nil {
		return actor{}, web.NewError(http.StatusUnauthorized, "missing authenticated citizen")
	}

	return requester, nil
}

// authorityFor resolve os fatos de autorização do ator. Sysadmin curto-circuita
// as consultas de maintainer. territoryID vazio dispensa o vínculo territorial.
func (s *Service) authorityFor(ctx context.Context, requester actor, territoryID string) (DecisionAuthority, error) {
	auth := DecisionAuthority{IsSysadmin: isSysadminRole(requester.Role)}
	if auth.IsSysadmin {
		return auth, nil
	}

	general, err := s.repo.isGeneralMaintainer(ctx, requester.ID)
	if err != nil {
		return DecisionAuthority{}, err
	}
	auth.IsGeneralMaintainer = general

	if territoryID != "" {
		local, err := s.repo.isTerritorialMaintainer(ctx, requester.ID, territoryID)
		if err != nil {
			return DecisionAuthority{}, err
		}
		auth.IsTerritorialMaintainerHere = local
	}

	return auth, nil
}

// ── Vínculo ───────────────────────────────────────────────────────────────────

func (s *Service) RequestBond(ctx context.Context, citizenID, territoryIdentifier string, input requestBondInput) (Bond, error) {
	requester, err := s.requireActor(ctx, citizenID)
	if err != nil {
		return Bond{}, err
	}

	bondType := strings.ToLower(strings.TrimSpace(input.BondType))
	if !isValidBondType(bondType) {
		return Bond{}, web.NewError(http.StatusBadRequest, "bondType must be morador, trabalhador or estudante")
	}

	territoryID, _, err := s.repo.resolveTerritory(ctx, territoryIdentifier)
	if err != nil {
		return Bond{}, web.NewError(http.StatusNotFound, "territory not found")
	}

	// Regra forte: território sem maintainer não aceita novos vínculos.
	hasMaintainer, err := s.repo.hasActiveTerritorialMaintainer(ctx, territoryID)
	if err != nil {
		return Bond{}, err
	}
	if !hasMaintainer {
		return Bond{}, web.NewError(http.StatusConflict, "this territory has no active maintainer and is not accepting new bonds")
	}

	return s.repo.createBond(ctx, requester, territoryID, bondType, strings.TrimSpace(input.EvidenceNote))
}

func (s *Service) MyBond(ctx context.Context, citizenID string) (Bond, error) {
	if _, err := s.requireActor(ctx, citizenID); err != nil {
		return Bond{}, err
	}

	bond, err := s.repo.getActiveBondByCitizen(ctx, citizenID)
	if errors.Is(err, pgx.ErrNoRows) {
		return Bond{}, web.NewError(http.StatusNotFound, "citizen has no active territorial bond")
	}

	return bond, err
}

func (s *Service) ListTerritoryBonds(ctx context.Context, citizenID, territoryIdentifier, status string) ([]Bond, error) {
	requester, err := s.requireActor(ctx, citizenID)
	if err != nil {
		return nil, err
	}

	territoryID, _, err := s.repo.resolveTerritory(ctx, territoryIdentifier)
	if err != nil {
		return nil, web.NewError(http.StatusNotFound, "territory not found")
	}

	authority, err := s.authorityFor(ctx, requester, territoryID)
	if err != nil {
		return nil, err
	}
	if !authority.CanDecideForTerritory() {
		return nil, web.NewError(http.StatusForbidden, "listing bonds requires territorial maintainership")
	}

	return s.repo.listBondsByTerritory(ctx, territoryID, strings.TrimSpace(status))
}

func (s *Service) DecideBond(ctx context.Context, citizenID, bondID string, input decideBondInput) (Bond, error) {
	requester, err := s.requireActor(ctx, citizenID)
	if err != nil {
		return Bond{}, err
	}

	bond, err := s.repo.getBond(ctx, bondID)
	if errors.Is(err, pgx.ErrNoRows) {
		return Bond{}, web.NewError(http.StatusNotFound, "bond not found")
	}
	if err != nil {
		return Bond{}, err
	}

	authority, err := s.authorityFor(ctx, requester, bond.TerritoryID)
	if err != nil {
		return Bond{}, err
	}
	if !authority.CanDecideForTerritory() {
		return Bond{}, web.NewError(http.StatusForbidden, "bond decisions require territorial maintainership")
	}

	reason := strings.TrimSpace(input.Reason)
	if err := CanApproveOrReject(bond.Status, input.Approve, reason); err != nil {
		return Bond{}, err
	}

	if input.Approve {
		trustLevel, err := ResolveApprovalTrustLevel(bond.BondType, strings.ToUpper(strings.TrimSpace(input.TrustLevel)))
		if err != nil {
			return Bond{}, err
		}

		return s.repo.updateBondStatus(ctx, requester, "institutional", bondID,
			BondStatusPending, BondStatusApproved, trustLevel, reason, "bond.approved")
	}

	return s.repo.updateBondStatus(ctx, requester, "institutional", bondID,
		BondStatusPending, BondStatusRejected, "", reason, "bond.rejected")
}

// ── Recurso ao Maintainer Geral ───────────────────────────────────────────────

func (s *Service) AppealBond(ctx context.Context, citizenID, bondID string, input appealInput) (Appeal, error) {
	requester, err := s.requireActor(ctx, citizenID)
	if err != nil {
		return Appeal{}, err
	}

	reason := strings.TrimSpace(input.Reason)
	if reason == "" {
		return Appeal{}, web.NewError(http.StatusBadRequest, "appeal reason is required")
	}

	bond, err := s.repo.getBond(ctx, bondID)
	if errors.Is(err, pgx.ErrNoRows) {
		return Appeal{}, web.NewError(http.StatusNotFound, "bond not found")
	}
	if err != nil {
		return Appeal{}, err
	}

	if err := CanAppeal(bond.Status, bond.CitizenID == requester.ID); err != nil {
		return Appeal{}, err
	}

	return s.repo.createAppeal(ctx, requester, bondID, reason)
}

func (s *Service) DecideAppeal(ctx context.Context, citizenID, appealID string, input decideAppealInput) (Bond, error) {
	requester, err := s.requireActor(ctx, citizenID)
	if err != nil {
		return Bond{}, err
	}

	authority, err := s.authorityFor(ctx, requester, "")
	if err != nil {
		return Bond{}, err
	}
	if !authority.IsGeneralInstance() {
		return Bond{}, web.NewError(http.StatusForbidden, "appeal decisions require the general maintainer")
	}

	record, err := s.repo.getAppeal(ctx, appealID)
	if errors.Is(err, pgx.ErrNoRows) {
		return Bond{}, web.NewError(http.StatusNotFound, "appeal not found")
	}
	if err != nil {
		return Bond{}, err
	}

	reason := strings.TrimSpace(input.Reason)
	if reason == "" {
		return Bond{}, web.NewError(http.StatusBadRequest, "appeal decisions must be reasoned")
	}

	if input.Uphold {
		bond, err := s.repo.getBond(ctx, record.BondID)
		if err != nil {
			return Bond{}, err
		}

		if err := s.repo.decideAppeal(ctx, requester, appealID, AppealStatusGranted, reason); err != nil {
			return Bond{}, err
		}

		return s.repo.updateBondStatus(ctx, requester, "institutional", record.BondID,
			BondStatusRejected, BondStatusApproved, defaultTrustLevel(bond.BondType), reason, "bond.appeal_granted")
	}

	if err := s.repo.decideAppeal(ctx, requester, appealID, AppealStatusDenied, reason); err != nil {
		return Bond{}, err
	}

	return s.repo.getBond(ctx, record.BondID)
}

// ── Contestação comunitária ───────────────────────────────────────────────────

func (s *Service) ContestBond(ctx context.Context, citizenID, bondID string, input contestInput) (Contestation, error) {
	requester, err := s.requireActor(ctx, citizenID)
	if err != nil {
		return Contestation{}, err
	}

	reason := strings.TrimSpace(input.Reason)
	if reason == "" {
		return Contestation{}, web.NewError(http.StatusBadRequest, "contestation requires a justification")
	}

	bond, err := s.repo.getBond(ctx, bondID)
	if errors.Is(err, pgx.ErrNoRows) {
		return Contestation{}, web.NewError(http.StatusNotFound, "bond not found")
	}
	if err != nil {
		return Contestation{}, err
	}

	// Vínculo do contestante (pode não existir): alimenta o ABAC da policy.
	contestantBond, err := s.repo.getActiveBondByCitizen(ctx, requester.ID)
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return Contestation{}, err
	}

	if err := CanContest(ContestEligibility{
		BondStatus:            bond.Status,
		IsOwnBond:             bond.CitizenID == requester.ID,
		ContestantBondStatus:  contestantBond.Status,
		ContestantTerritoryID: contestantBond.TerritoryID,
		BondTerritoryID:       bond.TerritoryID,
	}); err != nil {
		return Contestation{}, err
	}

	// Período de descanso: vínculo "Mantido" não é recontestável por 180 dias,
	// salvo fato novo.
	lastUpheld, hasLastUpheld, err := s.repo.lastUpheldContestationAt(ctx, bondID)
	if err != nil {
		return Contestation{}, err
	}
	if err := CanReopenContestation(lastUpheld, hasLastUpheld, time.Now().UTC(), input.HasNewFact); err != nil {
		return Contestation{}, err
	}

	return s.repo.createContestation(ctx, requester, bondID, reason, input.HasNewFact)
}

func (s *Service) SubmitDefense(ctx context.Context, citizenID, contestationID string, input defenseInput) error {
	requester, err := s.requireActor(ctx, citizenID)
	if err != nil {
		return err
	}

	defense := strings.TrimSpace(input.Defense)
	if defense == "" {
		return web.NewError(http.StatusBadRequest, "defense text is required")
	}

	record, err := s.repo.getContestation(ctx, contestationID)
	if errors.Is(err, pgx.ErrNoRows) {
		return web.NewError(http.StatusNotFound, "contestation not found")
	}
	if err != nil {
		return err
	}

	if record.BondOwnerID != requester.ID {
		return web.NewError(http.StatusForbidden, "only the bond owner can submit a defense")
	}

	return s.repo.submitDefense(ctx, requester, contestationID, defense)
}

func (s *Service) DecideContestation(ctx context.Context, citizenID, contestationID string, input decideContestationInput) (Bond, error) {
	requester, err := s.requireActor(ctx, citizenID)
	if err != nil {
		return Bond{}, err
	}

	record, err := s.repo.getContestation(ctx, contestationID)
	if errors.Is(err, pgx.ErrNoRows) {
		return Bond{}, web.NewError(http.StatusNotFound, "contestation not found")
	}
	if err != nil {
		return Bond{}, err
	}

	outcome := strings.TrimSpace(input.Outcome)
	reason := strings.TrimSpace(input.Reason)
	if reason == "" {
		return Bond{}, web.NewError(http.StatusBadRequest, "contestation decisions must be reasoned")
	}

	if err := ValidateContestationOutcome(record.Status, outcome); err != nil {
		return Bond{}, err
	}

	authority, err := s.authorityFor(ctx, requester, record.TerritoryID)
	if err != nil {
		return Bond{}, err
	}

	switch record.Status {
	case ContestationStatusOpen:
		// Primeira instância: maintainer territorial (ou geral/sysadmin).
		if !authority.CanDecideForTerritory() {
			return Bond{}, web.NewError(http.StatusForbidden, "deciding a contestation requires territorial maintainership")
		}
	case ContestationStatusEscalated:
		// Segunda instância: somente a instância recursal.
		if !authority.IsGeneralInstance() {
			return Bond{}, web.NewError(http.StatusForbidden, "escalated contestations are decided by the general maintainer")
		}
	}

	if err := s.repo.decideContestation(ctx, requester, record, outcome, reason); err != nil {
		return Bond{}, err
	}

	return s.repo.getBond(ctx, record.BondID)
}

// ── Governança pública ────────────────────────────────────────────────────────

func (s *Service) TerritoryGovernance(ctx context.Context, territoryIdentifier string) (GovernanceSummary, error) {
	territoryID, territoryName, err := s.repo.resolveTerritory(ctx, territoryIdentifier)
	if err != nil {
		return GovernanceSummary{}, web.NewError(http.StatusNotFound, "territory not found")
	}

	return s.repo.governanceSummary(ctx, territoryID, territoryName)
}
