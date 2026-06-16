package op

import (
	"net/http"
	"testing"
	"time"
)

var generalActor = CycleActor{IsGeneralMaintainer: true}
var sysadminActor = CycleActor{IsSysadmin: true}
var nobody = CycleActor{}

// TestCycleAdvancesForwardOnly percorre a esteira inteira e prova que cada fase
// avança só para a próxima — e que pular ou voltar é recusado.
func TestCycleAdvancesForwardOnly(t *testing.T) {
	phase := CyclePhaseDraft
	expected := []string{
		CyclePhaseInscriptions, CyclePhaseCollection, CyclePhaseVoting,
		CyclePhaseConsolidation, CyclePhaseInstitutional, CyclePhaseClosed,
	}
	for _, want := range expected {
		next, ok := NextPhase(phase)
		if !ok || next != want {
			t.Fatalf("de %s esperava %s, obtive %s (ok=%v)", phase, want, next, ok)
		}
		if err := ValidateTransition(phase, next, generalActor); err != nil {
			t.Fatalf("transição %s→%s deveria valer: %v", phase, next, err)
		}
		phase = next
	}
	// Encerrado é terminal.
	if _, ok := NextPhase(CyclePhaseClosed); ok {
		t.Error("ciclo encerrado não deveria ter próxima fase")
	}
}

func TestCycleRejectsSkipAndRewind(t *testing.T) {
	// Pular fase: Rascunho → Votação.
	if status := statusOf(t, ValidateTransition(CyclePhaseDraft, CyclePhaseVoting, generalActor)); status != http.StatusConflict {
		t.Errorf("pular fase deveria ser 409, foi %d", status)
	}
	// Voltar: Votação → Coleta (reabrir o que já foi decidido).
	if status := statusOf(t, ValidateTransition(CyclePhaseVoting, CyclePhaseCollection, generalActor)); status != http.StatusConflict {
		t.Errorf("regredir fase deveria ser 409, foi %d", status)
	}
}

func TestCycleAdvanceRequiresGeneralInstance(t *testing.T) {
	if status := statusOf(t, ValidateTransition(CyclePhaseDraft, CyclePhaseInscriptions, nobody)); status != http.StatusForbidden {
		t.Errorf("sem instância geral deveria ser 403, foi %d", status)
	}
	// sysadmin (bootstrap) e maintainer geral podem.
	if err := ValidateTransition(CyclePhaseDraft, CyclePhaseInscriptions, sysadminActor); err != nil {
		t.Errorf("sysadmin deveria poder avançar: %v", err)
	}
}

func TestCycleCancelFromAnyNonTerminal(t *testing.T) {
	for _, p := range []string{
		CyclePhaseDraft, CyclePhaseInscriptions, CyclePhaseCollection,
		CyclePhaseVoting, CyclePhaseConsolidation, CyclePhaseInstitutional,
	} {
		if err := ValidateTransition(p, CyclePhaseCanceled, generalActor); err != nil {
			t.Errorf("deveria poder cancelar de %s: %v", p, err)
		}
	}
	// Não se cancela o que já é terminal.
	if status := statusOf(t, ValidateTransition(CyclePhaseClosed, CyclePhaseCanceled, generalActor)); status != http.StatusConflict {
		t.Errorf("cancelar encerrado deveria ser 409, foi %d", status)
	}
	if status := statusOf(t, ValidateTransition(CyclePhaseCanceled, CyclePhaseCanceled, generalActor)); status != http.StatusConflict {
		t.Errorf("cancelar cancelado deveria ser 409, foi %d", status)
	}
}

// TestConfigFrozenAfterDraft (kernel): o envelope/regimento só muda em Rascunho.
func TestConfigFrozenAfterDraft(t *testing.T) {
	if err := CanConfigure(CyclePhaseDraft); err != nil {
		t.Errorf("Rascunho deveria permitir configurar: %v", err)
	}
	for _, p := range []string{CyclePhaseInscriptions, CyclePhaseVoting, CyclePhaseClosed} {
		if status := statusOf(t, CanConfigure(p)); status != http.StatusConflict {
			t.Errorf("configurar em %s deveria ser 409 (congelado), foi %d", p, status)
		}
	}
}

func TestPhaseGates(t *testing.T) {
	if !DemandsOpen(CyclePhaseCollection) {
		t.Error("demandas deveriam abrir na Coleta")
	}
	if DemandsOpen(CyclePhaseVoting) {
		t.Error("demandas NÃO deveriam abrir na Votação")
	}
	if !VotingOpen(CyclePhaseVoting) {
		t.Error("voto deveria abrir na Votação")
	}
	if VotingOpen(CyclePhaseCollection) {
		t.Error("voto NÃO deveria abrir na Coleta")
	}
}

func TestBuildCalendarOrder(t *testing.T) {
	start := time.Date(2026, 3, 1, 0, 0, 0, 0, time.UTC)
	cal := BuildCalendar(start, DefaultRegimento())

	if !cal.SortitionAt.After(cal.InscriptionStart) {
		t.Error("sorteio deveria vir depois do início das inscrições")
	}
	if !cal.VotingStart.After(cal.CollectionStart) {
		t.Error("votação deveria começar depois da coleta/maturação")
	}
	if !cal.VotingEnd.After(cal.VotingStart) {
		t.Error("votação deveria ter duração positiva")
	}
	// Com os defaults: 15 + 30 + 10 = 55 dias do início ao fim da votação.
	if got := cal.VotingEnd.Sub(start); got != 55*24*time.Hour {
		t.Errorf("duração total = %v, esperava 55 dias", got)
	}
}

// TestCalendarMustFitLOADeadline (PROTOCOLO §5): a votação tem de terminar antes
// do prazo legal da LOA.
func TestCalendarMustFitLOADeadline(t *testing.T) {
	start := time.Date(2026, 3, 1, 0, 0, 0, 0, time.UTC)
	reg := DefaultRegimento()

	// Prazo folgado: ok.
	folgado := start.Add(120 * 24 * time.Hour)
	if _, err := CanScheduleCycle(start, reg, folgado); err != nil {
		t.Errorf("calendário deveria caber no prazo folgado: %v", err)
	}

	// Prazo apertado (30 dias < 55 necessários): falha.
	apertado := start.Add(30 * 24 * time.Hour)
	if status := statusOf(t, mustErrCal(CanScheduleCycle(start, reg, apertado))); status != http.StatusUnprocessableEntity {
		t.Errorf("calendário estourando a LOA deveria ser 422, foi %d", status)
	}
}

func mustErrCal(_ Calendar, err error) error { return err }
