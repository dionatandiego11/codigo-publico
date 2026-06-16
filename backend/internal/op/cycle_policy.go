package op

import (
	"net/http"
	"time"

	"codigo-publico/backend/internal/web"
)

// cycle_policy.go — a máquina de estados do ciclo do OP. O ciclo avança por fases
// que espelham a esteira (PROTOCOLO-OP §3) e que *gateiam* o que pode acontecer:
// demanda só na coleta, voto só na votação. Duas regras constitucionais guiam o
// desenho:
//
//  1. o ciclo só anda PARA FRENTE (e nunca pula fase). Reabrir uma fase anterior
//     — ex.: voltar de "Votação" para "Coleta" — permitiria manipular o que já foi
//     decidido; é proibido. Os "retornos" da esteira acontecem DENTRO de uma fase
//     (uma demanda volta à maturação), não fazendo o ciclo regredir.
//  2. a configuração (regimento, calendário, territórios, envelope) é CONGELADA
//     após a abertura: ninguém muda o envelope depois que a votação já começou.

const (
	CyclePhaseDraft         = "Rascunho"            // configuração; tudo ainda editável
	CyclePhaseInscriptions  = "Inscrições"          // inscrição ao conselho territorial
	CyclePhaseCollection    = "Coleta"              // demanda, apoio, fork, maturação, filtros
	CyclePhaseVoting        = "Votação"             // votação territorial
	CyclePhaseConsolidation = "Consolidação"        // matriz + filtro institucional
	CyclePhaseInstitutional = "Institucionalização" // Câmara, PPA/LDO/LOA, release
	CyclePhaseClosed        = "Encerrado"           // ciclo fechado (execução/aprendizado seguem ligados)
	CyclePhaseCanceled      = "Cancelado"           // abortado
)

// cyclePhaseOrder é a progressão linear das fases até o encerramento. O ciclo só
// pode ir para a fase imediatamente seguinte (sem pular, sem voltar).
var cyclePhaseOrder = []string{
	CyclePhaseDraft,
	CyclePhaseInscriptions,
	CyclePhaseCollection,
	CyclePhaseVoting,
	CyclePhaseConsolidation,
	CyclePhaseInstitutional,
	CyclePhaseClosed,
}

// CycleActor reúne a autoridade para mover o ciclo. Mover fases é ato
// institucional do Maintainer Geral (ou do sysadmin no bootstrap) — o Maintainer
// Territorial organiza dentro da fase, mas não decide quando o ciclo avança.
type CycleActor struct {
	IsSysadmin          bool
	IsGeneralMaintainer bool
}

func (a CycleActor) isGeneralInstance() bool {
	return a.IsSysadmin || a.IsGeneralMaintainer
}

// phaseRank devolve a posição da fase na ordem (-1 se desconhecida ou terminal
// fora da progressão, como Cancelado).
func phaseRank(phase string) int {
	for i, p := range cyclePhaseOrder {
		if p == phase {
			return i
		}
	}
	return -1
}

// IsTerminalPhase indica fases sem saída: ciclo encerrado ou cancelado.
func IsTerminalPhase(phase string) bool {
	return phase == CyclePhaseClosed || phase == CyclePhaseCanceled
}

// NextPhase devolve a próxima fase da progressão e ok=false se não houver (fase
// terminal ou desconhecida).
func NextPhase(current string) (string, bool) {
	rank := phaseRank(current)
	if rank < 0 || rank >= len(cyclePhaseOrder)-1 {
		return "", false
	}
	return cyclePhaseOrder[rank+1], true
}

// CanAdvance valida o avanço do ciclo para a próxima fase: exige a instância
// geral e que exista próxima fase (não se avança um ciclo encerrado/cancelado).
func CanAdvance(current string, actor CycleActor) error {
	if !actor.isGeneralInstance() {
		return web.NewError(http.StatusForbidden, "avançar o ciclo exige a instância geral")
	}
	if IsTerminalPhase(current) {
		return web.NewError(http.StatusConflict, "ciclo encerrado ou cancelado não avança")
	}
	if _, ok := NextPhase(current); !ok {
		return web.NewError(http.StatusConflict, "não há próxima fase a partir de "+current)
	}
	return nil
}

// CanCancel: o ciclo pode ser cancelado a partir de qualquer fase não-terminal,
// pela instância geral. Cancelar é terminal e auditado.
func CanCancel(current string, actor CycleActor) error {
	if !actor.isGeneralInstance() {
		return web.NewError(http.StatusForbidden, "cancelar o ciclo exige a instância geral")
	}
	if IsTerminalPhase(current) {
		return web.NewError(http.StatusConflict, "ciclo já está encerrado ou cancelado")
	}
	return nil
}

// ValidateTransition é a porta única de transição: aceita avançar para a próxima
// fase ou cancelar. Qualquer outro destino (pular fase, voltar) é recusado — é a
// regra constitucional do "só para frente, sem pular".
func ValidateTransition(from, to string, actor CycleActor) error {
	if to == CyclePhaseCanceled {
		return CanCancel(from, actor)
	}
	if err := CanAdvance(from, actor); err != nil {
		return err
	}
	next, _ := NextPhase(from)
	if to != next {
		return web.NewError(http.StatusConflict,
			"transição inválida: de "+from+" só se avança para "+next+" (ou Cancelado)")
	}
	return nil
}

// CanConfigure: regimento, calendário, territórios e envelope só podem ser
// alterados enquanto o ciclo está em Rascunho. Após a abertura, a configuração é
// congelada — ninguém muda o envelope depois que o jogo começou.
func CanConfigure(current string) error {
	if current != CyclePhaseDraft {
		return web.NewError(http.StatusConflict, "a configuração do ciclo é congelada após a abertura")
	}
	return nil
}

// DemandsOpen indica se o ciclo aceita novas demandas (apenas na Coleta).
func DemandsOpen(phase string) bool {
	return phase == CyclePhaseCollection
}

// VotingOpen indica se a votação territorial está aberta (apenas na Votação).
func VotingOpen(phase string) bool {
	return phase == CyclePhaseVoting
}

// --- Calendário (PROTOCOLO-OP §5) ---

// Calendar são as datas-âncora do ciclo, derivadas das janelas do regimento.
type Calendar struct {
	InscriptionStart time.Time // abertura das inscrições ao conselho
	SortitionAt      time.Time // fim das inscrições / sorteio dos conselhos
	CollectionStart  time.Time // início da coleta (= sorteio)
	VotingStart      time.Time // fim da maturação / início da votação
	VotingEnd        time.Time // fim da votação territorial
}

// BuildCalendar projeta as datas do ciclo a partir do início e das janelas do
// regimento local. A coleta começa no sorteio; a votação começa ao fim da
// maturação. Consolidação e institucionalização ocorrem entre VotingEnd e o
// prazo da LOA.
func BuildCalendar(start time.Time, reg RegimentoLocal) Calendar {
	sortition := start.Add(reg.InscriptionWindow)
	votingStart := sortition.Add(reg.MaturationWindow)
	return Calendar{
		InscriptionStart: start,
		SortitionAt:      sortition,
		CollectionStart:  sortition,
		VotingStart:      votingStart,
		VotingEnd:        votingStart.Add(reg.VotingWindow),
	}
}

// ValidateCalendar garante que a votação termina antes do prazo legal da LOA,
// deixando margem para consolidação e institucionalização. Sem isso, a esteira
// não cabe no ciclo fiscal.
func ValidateCalendar(cal Calendar, loaDeadline time.Time) error {
	if !cal.VotingEnd.Before(loaDeadline) {
		return web.NewError(http.StatusUnprocessableEntity,
			"a votação precisa terminar antes do prazo da LOA ("+loaDeadline.Format("2006-01-02")+")")
	}
	return nil
}

// CanScheduleCycle valida de uma vez o regimento, projeta o calendário e confere
// o prazo da LOA — a checagem completa antes de abrir um ciclo.
func CanScheduleCycle(start time.Time, reg RegimentoLocal, loaDeadline time.Time) (Calendar, error) {
	if err := reg.Validate(); err != nil {
		return Calendar{}, err
	}
	cal := BuildCalendar(start, reg)
	if err := ValidateCalendar(cal, loaDeadline); err != nil {
		return Calendar{}, err
	}
	return cal, nil
}
