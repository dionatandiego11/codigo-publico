package demands

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"codigo-publico/backend/internal/op"
	"codigo-publico/backend/internal/web"

	"github.com/jackc/pgx/v5"
)

type Service struct {
	repo *Repository
}

const (
	statusReceived            = "Recebida"
	statusInitialEngagement   = "Engajamento inicial"
	statusNeedsInfo           = "Precisa de informações"
	statusGrouped             = "Agrupada"
	statusTerritorialMaturing = "Maturação territorial"
	statusTerritoriallyValid  = "Validada territorialmente"
	statusReadyPrioritization = "Apta para priorização"
	statusIncludedMatrix      = "Incluída na matriz orçamentária"
	statusInExecution         = "Em execução"
	statusCompleted           = "Concluída"
	statusDormant             = "Dormente"
	statusArchived            = "Arquivada"
)

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) ListDemands(ctx context.Context) ([]Demand, error) {
	return s.repo.listDemands(ctx)
}

func (s *Service) ListDemandsByTerritory(ctx context.Context, territoryID string) ([]Demand, error) {
	territory, err := s.repo.resolveTerritory(ctx, strings.TrimSpace(territoryID))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, web.NewError(http.StatusNotFound, "território não encontrado")
	}
	if err != nil {
		return nil, err
	}

	return s.repo.listDemandsByTerritory(ctx, territory)
}

func (s *Service) GetDemand(ctx context.Context, identifier string) (Demand, error) {
	demand, _, err := s.repo.getDemand(ctx, strings.TrimSpace(identifier))
	if errors.Is(err, pgx.ErrNoRows) {
		return Demand{}, web.NewError(http.StatusNotFound, "demanda não encontrada")
	}
	return demand, err
}

func (s *Service) CreateDemand(ctx context.Context, citizenID string, input createDemandInput) (Demand, error) {
	a, err := s.requireActor(ctx, citizenID)
	if err != nil {
		return Demand{}, err
	}

	cycle, err := s.repo.currentCycle(ctx)
	if errors.Is(err, pgx.ErrNoRows) {
		return Demand{}, web.NewError(http.StatusConflict, "não há ciclo de OP ativo para receber demandas")
	}
	if err != nil {
		return Demand{}, err
	}
	if !op.DemandsOpen(cycle.Phase) {
		return Demand{}, web.NewError(http.StatusConflict, "demandas só podem ser criadas na fase Coleta do ciclo de OP")
	}

	input = normalizeDemandInput(input)
	if input.Title == "" {
		return Demand{}, web.NewError(http.StatusBadRequest, "title é obrigatório")
	}
	if input.Category == "" {
		return Demand{}, web.NewError(http.StatusBadRequest, "category é obrigatório")
	}

	territoryIdentifier := input.TerritoryID
	if territoryIdentifier == "" {
		territoryIdentifier = a.TerritoryID
	}
	if territoryIdentifier == "" {
		return Demand{}, web.NewError(http.StatusBadRequest, "territoryId é obrigatório")
	}

	territory, err := s.repo.resolveTerritory(ctx, territoryIdentifier)
	if errors.Is(err, pgx.ErrNoRows) {
		return Demand{}, web.NewError(http.StatusBadRequest, "territoryId não foi encontrado")
	}
	if err != nil {
		return Demand{}, err
	}

	return s.repo.createDemand(ctx, a, cycle, territory, input)
}

func (s *Service) SupportDemand(ctx context.Context, citizenID string, identifier string) (Demand, error) {
	a, err := s.requireActor(ctx, citizenID)
	if err != nil {
		return Demand{}, err
	}

	demand, err := s.repo.supportDemand(ctx, a, strings.TrimSpace(identifier))
	if errors.Is(err, pgx.ErrNoRows) {
		return Demand{}, web.NewError(http.StatusNotFound, "demanda não encontrada")
	}
	return demand, err
}

func (s *Service) CreateComment(ctx context.Context, citizenID string, identifier string, input createCommentInput) (DemandComment, error) {
	a, err := s.requireActor(ctx, citizenID)
	if err != nil {
		return DemandComment{}, err
	}

	input.Content = strings.TrimSpace(input.Content)
	if input.Content == "" {
		return DemandComment{}, web.NewError(http.StatusBadRequest, "content é obrigatório")
	}

	comment, err := s.repo.createComment(ctx, a, strings.TrimSpace(identifier), input)
	if errors.Is(err, pgx.ErrNoRows) {
		return DemandComment{}, web.NewError(http.StatusNotFound, "demanda não encontrada")
	}
	return comment, err
}

func (s *Service) StartMaturation(ctx context.Context, citizenID string, identifier string, input transitionInput) (Demand, error) {
	return s.transitionWithAuthority(ctx, citizenID, identifier, transitionSpec{
		NewStatus: statusTerritorialMaturing,
		Action:    "op.demand.maturation_started",
		AllowedFrom: map[string]bool{
			statusReceived:          true,
			statusInitialEngagement: true,
			statusNeedsInfo:         true,
		},
		Reason: strings.TrimSpace(input.Reason),
	})
}

func (s *Service) RequestInfo(ctx context.Context, citizenID string, identifier string, input transitionInput) (Demand, error) {
	reason := strings.TrimSpace(input.Reason)
	if reason == "" {
		return Demand{}, web.NewError(http.StatusBadRequest, "reason é obrigatório")
	}

	return s.transitionWithAuthority(ctx, citizenID, identifier, transitionSpec{
		NewStatus: statusNeedsInfo,
		Action:    "op.demand.info_requested",
		AllowedFrom: map[string]bool{
			statusReceived:            true,
			statusInitialEngagement:   true,
			statusTerritorialMaturing: true,
			statusTerritoriallyValid:  true,
		},
		Reason: reason,
	})
}

func (s *Service) ValidateTerritory(ctx context.Context, citizenID string, identifier string, input transitionInput) (Demand, error) {
	return s.transitionWithAuthority(ctx, citizenID, identifier, transitionSpec{
		NewStatus: statusTerritoriallyValid,
		Action:    "op.demand.territory_validated",
		AllowedFrom: map[string]bool{
			statusReceived:            true,
			statusInitialEngagement:   true,
			statusNeedsInfo:           true,
			statusTerritorialMaturing: true,
		},
		Reason: strings.TrimSpace(input.Reason),
	})
}

func (s *Service) MarkReady(ctx context.Context, citizenID string, identifier string, input transitionInput) (Demand, error) {
	a, rec, err := s.requireDemandAuthority(ctx, citizenID, identifier)
	if err != nil {
		return Demand{}, err
	}
	if rec.Status != statusTerritoriallyValid {
		return Demand{}, web.NewError(http.StatusConflict, "a demanda precisa estar validada territorialmente antes de ficar apta")
	}
	if rec.Supports < rec.SupportThreshold {
		return Demand{}, web.NewError(http.StatusConflict, "a demanda ainda não atingiu o apoio mínimo do regimento local")
	}

	return s.repo.transitionDemandStatus(ctx, a, rec, statusReadyPrioritization, "op.demand.ready_for_prioritization", strings.TrimSpace(input.Reason))
}

func (s *Service) GroupDemand(ctx context.Context, citizenID string, identifier string, input groupDemandInput) (Demand, error) {
	reason := strings.TrimSpace(input.Reason)
	if reason == "" {
		return Demand{}, web.NewError(http.StatusBadRequest, "reason é obrigatório")
	}

	a, source, err := s.requireDemandAuthority(ctx, citizenID, identifier)
	if err != nil {
		return Demand{}, err
	}
	if terminalDemandStatus(source.Status) {
		return Demand{}, web.NewError(http.StatusConflict, "demanda em estado terminal não pode ser agrupada")
	}
	if source.GroupedIntoID != "" || source.Status == statusGrouped {
		return Demand{}, web.NewError(http.StatusConflict, "demanda já está agrupada")
	}

	targetID := strings.TrimSpace(input.TargetDemandID)
	if targetID == "" {
		return Demand{}, web.NewError(http.StatusBadRequest, "targetDemandId é obrigatório")
	}

	target, err := s.repo.demandRecord(ctx, targetID)
	if errors.Is(err, pgx.ErrNoRows) {
		return Demand{}, web.NewError(http.StatusNotFound, "demanda de destino não encontrada")
	}
	if err != nil {
		return Demand{}, err
	}
	if source.ID == target.ID {
		return Demand{}, web.NewError(http.StatusBadRequest, "uma demanda não pode ser agrupada nela mesma")
	}
	if source.CycleID != target.CycleID {
		return Demand{}, web.NewError(http.StatusConflict, "só é possível agrupar demandas do mesmo ciclo")
	}
	if source.TerritoryID != target.TerritoryID {
		return Demand{}, web.NewError(http.StatusConflict, "agrupamento entre territórios ainda não está habilitado")
	}
	if target.GroupedIntoID != "" || target.Status == statusGrouped {
		return Demand{}, web.NewError(http.StatusConflict, "não agrupe em uma demanda que já foi agrupada em outra")
	}

	return s.repo.groupDemand(ctx, a, source, target, reason)
}

func (s *Service) ForkDemand(ctx context.Context, citizenID string, identifier string, input forkDemandInput) (Demand, error) {
	a, err := s.requireActor(ctx, citizenID)
	if err != nil {
		return Demand{}, err
	}

	source, err := s.repo.demandRecord(ctx, strings.TrimSpace(identifier))
	if errors.Is(err, pgx.ErrNoRows) {
		return Demand{}, web.NewError(http.StatusNotFound, "demanda original não encontrada")
	}
	if err != nil {
		return Demand{}, err
	}
	if !op.DemandsOpen(source.CyclePhase) {
		return Demand{}, web.NewError(http.StatusConflict, "forks só podem ser criados na fase Coleta do ciclo de OP")
	}
	if source.GroupedIntoID != "" || source.Status == statusGrouped {
		return Demand{}, web.NewError(http.StatusConflict, "crie forks a partir da demanda canônica, não da demanda agrupada")
	}
	if terminalDemandStatus(source.Status) {
		return Demand{}, web.NewError(http.StatusConflict, "demanda em estado terminal não pode receber fork")
	}

	input = normalizeForkInput(input, source)
	if input.Title == "" {
		return Demand{}, web.NewError(http.StatusBadRequest, "title é obrigatório")
	}
	if input.Category == "" {
		return Demand{}, web.NewError(http.StatusBadRequest, "category é obrigatório")
	}

	return s.repo.forkDemand(ctx, a, source, input)
}

func (s *Service) requireActor(ctx context.Context, citizenID string) (actor, error) {
	a, err := s.repo.actorByID(ctx, citizenID)
	if errors.Is(err, pgx.ErrNoRows) {
		return actor{}, web.NewError(http.StatusUnauthorized, "cidadão autenticado não encontrado")
	}
	return a, err
}

type transitionSpec struct {
	NewStatus   string
	Action      string
	AllowedFrom map[string]bool
	Reason      string
}

func (s *Service) transitionWithAuthority(ctx context.Context, citizenID string, identifier string, spec transitionSpec) (Demand, error) {
	a, rec, err := s.requireDemandAuthority(ctx, citizenID, identifier)
	if err != nil {
		return Demand{}, err
	}
	if terminalDemandStatus(rec.Status) {
		return Demand{}, web.NewError(http.StatusConflict, "demanda em estado terminal não pode ser movida por esta ação")
	}
	if !spec.AllowedFrom[rec.Status] {
		return Demand{}, web.NewError(http.StatusConflict, "transição inválida a partir de "+rec.Status)
	}

	return s.repo.transitionDemandStatus(ctx, a, rec, spec.NewStatus, spec.Action, spec.Reason)
}

func (s *Service) requireDemandAuthority(ctx context.Context, citizenID string, identifier string) (actor, demandRecord, error) {
	a, err := s.requireActor(ctx, citizenID)
	if err != nil {
		return actor{}, demandRecord{}, err
	}

	rec, err := s.repo.demandRecord(ctx, strings.TrimSpace(identifier))
	if errors.Is(err, pgx.ErrNoRows) {
		return actor{}, demandRecord{}, web.NewError(http.StatusNotFound, "demanda não encontrada")
	}
	if err != nil {
		return actor{}, demandRecord{}, err
	}

	if isAdminRole(a.Role) {
		return a, rec, nil
	}

	allowed, err := s.repo.hasDemandAuthority(ctx, a, rec.TerritoryID)
	if err != nil {
		return actor{}, demandRecord{}, err
	}
	if !allowed {
		return actor{}, demandRecord{}, web.NewError(http.StatusForbidden, "esta ação exige instância territorial ou geral")
	}

	return a, rec, nil
}

func normalizeDemandInput(input createDemandInput) createDemandInput {
	input.TerritoryID = strings.TrimSpace(input.TerritoryID)
	input.Title = strings.TrimSpace(input.Title)
	input.Description = strings.TrimSpace(input.Description)
	input.Location = strings.TrimSpace(input.Location)
	input.Category = strings.TrimSpace(input.Category)
	return input
}

func terminalDemandStatus(status string) bool {
	switch status {
	case statusGrouped, statusIncludedMatrix, statusInExecution, statusCompleted, statusDormant, statusArchived:
		return true
	default:
		return false
	}
}

func isAdminRole(role string) bool {
	switch strings.ToLower(strings.TrimSpace(role)) {
	case "sysadmin", "admin", "institutional_admin", "legislative_admin", "vereador", "mesa_diretora":
		return true
	default:
		return false
	}
}

func normalizeForkInput(input forkDemandInput, source demandRecord) forkDemandInput {
	input.Title = strings.TrimSpace(input.Title)
	input.Description = strings.TrimSpace(input.Description)
	input.Location = strings.TrimSpace(input.Location)
	input.Category = strings.TrimSpace(input.Category)
	input.Reason = strings.TrimSpace(input.Reason)

	if input.Description == "" {
		input.Description = source.Description
	}
	if input.Location == "" {
		input.Location = source.Location
	}
	if input.Category == "" {
		input.Category = source.Category
	}

	return input
}
