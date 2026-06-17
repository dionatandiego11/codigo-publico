package demands

import (
	"net/http"

	"codigo-publico/backend/internal/op"
	"codigo-publico/backend/internal/web"
)

// policy.go é a camada de decisão pura da demanda: o vocabulário de status, a
// tabela de transições da esteira e os gates (apto, agrupar, fork) como funções
// puras — sem banco nem rede. O serviço resolve os fatos (status atual, apoios,
// fase do ciclo) e delega a decisão aqui, o que torna a máquina de estados
// testável sem PostgreSQL. Ver docs/PROTOCOLO-OP.md (esteira).

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

// Conjuntos de origem permitidos por transição (a tabela da máquina de estados).
// São a "constituição" da esteira da demanda: cada ação só sai dos status listados.
var (
	maturationAllowedFrom = map[string]bool{
		statusReceived:          true,
		statusInitialEngagement: true,
		statusNeedsInfo:         true,
	}
	infoAllowedFrom = map[string]bool{
		statusReceived:            true,
		statusInitialEngagement:   true,
		statusTerritorialMaturing: true,
		statusTerritoriallyValid:  true,
	}
	territoryAllowedFrom = map[string]bool{
		statusReceived:            true,
		statusInitialEngagement:   true,
		statusNeedsInfo:           true,
		statusTerritorialMaturing: true,
	}
)

// terminalDemandStatus marca estados sem retorno por ação de maturação: já
// agrupada, na matriz, em execução, concluída, dormente ou arquivada.
func terminalDemandStatus(status string) bool {
	switch status {
	case statusGrouped, statusIncludedMatrix, statusInExecution, statusCompleted, statusDormant, statusArchived:
		return true
	default:
		return false
	}
}

// canApplyTransition é a regra genérica das transições da esteira: a demanda não
// pode estar em estado terminal e o status atual precisa estar no conjunto de
// origem permitido para a ação.
func canApplyTransition(from string, allowedFrom map[string]bool) error {
	if terminalDemandStatus(from) {
		return web.NewError(http.StatusConflict, "demanda em estado terminal não pode ser movida por esta ação")
	}
	if !allowedFrom[from] {
		return web.NewError(http.StatusConflict, "transição inválida a partir de "+from)
	}
	return nil
}

// canMarkReady: uma demanda só fica "apta para priorização" se validada
// territorialmente E com o apoio mínimo do regimento local atingido (os dois
// gates: protocolar e popular).
func canMarkReady(status string, supports, threshold int) error {
	if status != statusTerritoriallyValid {
		return web.NewError(http.StatusConflict, "a demanda precisa estar validada territorialmente antes de ficar apta")
	}
	if supports < threshold {
		return web.NewError(http.StatusConflict, "a demanda ainda não atingiu o apoio mínimo do regimento local")
	}
	return nil
}

// canSupportDemand garante que o apoio pertence ao território e à janela
// participativa correta. Apoio é gate popular do território, não sinal municipal.
func canSupportDemand(cyclePhase, actorTerritoryID, demandTerritoryID string) error {
	if !op.DemandsOpen(cyclePhase) {
		return web.NewError(http.StatusConflict, "apoios só podem ser registrados na fase Coleta do ciclo de OP")
	}
	if actorTerritoryID == "" {
		return web.NewError(http.StatusForbidden, "apoiar demanda exige vínculo territorial")
	}
	if actorTerritoryID != demandTerritoryID {
		return web.NewError(http.StatusForbidden, "somente cidadãos vinculados ao território da demanda podem apoiar")
	}
	return nil
}

// groupFacts reúne os campos de uma demanda relevantes para o agrupamento.
type groupFacts struct {
	ID            string
	CycleID       string
	TerritoryID   string
	Status        string
	GroupedIntoID string
}

// groupFactsOf extrai de um demandRecord os fatos relevantes ao agrupamento.
func groupFactsOf(r demandRecord) groupFacts {
	return groupFacts{
		ID:            r.ID,
		CycleID:       r.CycleID,
		TerritoryID:   r.TerritoryID,
		Status:        r.Status,
		GroupedIntoID: r.GroupedIntoID,
	}
}

// canGroup decide se a demanda de origem pode ser agrupada na de destino: nenhuma
// terminal/já agrupada, não em si mesma, mesmo ciclo e mesmo território (o
// agrupamento entre territórios ainda não está habilitado).
func canGroup(source, target groupFacts) error {
	if terminalDemandStatus(source.Status) {
		return web.NewError(http.StatusConflict, "demanda em estado terminal não pode ser agrupada")
	}
	if source.GroupedIntoID != "" || source.Status == statusGrouped {
		return web.NewError(http.StatusConflict, "demanda já está agrupada")
	}
	if source.ID == target.ID {
		return web.NewError(http.StatusBadRequest, "uma demanda não pode ser agrupada nela mesma")
	}
	if source.CycleID != target.CycleID {
		return web.NewError(http.StatusConflict, "só é possível agrupar demandas do mesmo ciclo")
	}
	if source.TerritoryID != target.TerritoryID {
		return web.NewError(http.StatusConflict, "agrupamento entre territórios ainda não está habilitado")
	}
	if target.GroupedIntoID != "" || target.Status == statusGrouped {
		return web.NewError(http.StatusConflict, "não agrupe em uma demanda que já foi agrupada em outra")
	}
	return nil
}

// canFork decide se uma demanda pode receber fork: o ciclo precisa estar na fase
// Coleta (op.DemandsOpen) e a origem precisa ser a demanda canônica, não-terminal.
func canFork(cyclePhase, status, groupedIntoID string) error {
	if !op.DemandsOpen(cyclePhase) {
		return web.NewError(http.StatusConflict, "forks só podem ser criados na fase Coleta do ciclo de OP")
	}
	if groupedIntoID != "" || status == statusGrouped {
		return web.NewError(http.StatusConflict, "crie forks a partir da demanda canônica, não da demanda agrupada")
	}
	if terminalDemandStatus(status) {
		return web.NewError(http.StatusConflict, "demanda em estado terminal não pode receber fork")
	}
	return nil
}
