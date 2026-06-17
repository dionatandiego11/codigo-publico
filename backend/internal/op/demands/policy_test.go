package demands

import (
	"errors"
	"net/http"
	"testing"

	"codigo-publico/backend/internal/web"
)

func statusOf(t *testing.T, err error) int {
	t.Helper()
	if err == nil {
		return 0
	}
	var appErr web.Error
	if !errors.As(err, &appErr) {
		t.Fatalf("esperava web.Error, obtive %T (%v)", err, err)
	}
	return appErr.StatusCode
}

// TestTerminalBlocksTransition: nenhuma ação de maturação move uma demanda em
// estado terminal.
func TestTerminalBlocksTransition(t *testing.T) {
	terminals := []string{statusGrouped, statusIncludedMatrix, statusInExecution, statusCompleted, statusDormant, statusArchived}
	for _, s := range terminals {
		if !terminalDemandStatus(s) {
			t.Errorf("%s deveria ser terminal", s)
		}
		if status := statusOf(t, canApplyTransition(s, maturationAllowedFrom)); status != http.StatusConflict {
			t.Errorf("transição a partir do terminal %s deveria ser 409, foi %d", s, status)
		}
	}
}

// TestTransitionTable verifica a tabela da máquina de estados: cada ação só sai
// dos status de origem permitidos.
func TestTransitionTable(t *testing.T) {
	cases := []struct {
		name        string
		allowedFrom map[string]bool
		from        string
		ok          bool
	}{
		{"maturação a partir de Recebida", maturationAllowedFrom, statusReceived, true},
		{"maturação a partir de Engajamento", maturationAllowedFrom, statusInitialEngagement, true},
		{"maturação NÃO a partir de Validada", maturationAllowedFrom, statusTerritoriallyValid, false},
		{"info a partir de Maturação", infoAllowedFrom, statusTerritorialMaturing, true},
		{"info a partir de Validada", infoAllowedFrom, statusTerritoriallyValid, true},
		{"validar a partir de Maturação", territoryAllowedFrom, statusTerritorialMaturing, true},
		{"validar NÃO a partir de Validada", territoryAllowedFrom, statusTerritoriallyValid, false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			err := canApplyTransition(tc.from, tc.allowedFrom)
			if tc.ok && err != nil {
				t.Errorf("esperava transição válida, obtive %v", err)
			}
			if !tc.ok && statusOf(t, err) != http.StatusConflict {
				t.Errorf("esperava 409 de transição inválida")
			}
		})
	}
}

// TestCanMarkReady cobre os dois gates da aptidão: validação territorial e apoio
// mínimo do regimento.
func TestCanMarkReady(t *testing.T) {
	if err := canMarkReady(statusTerritoriallyValid, 10, 10); err != nil {
		t.Errorf("validada e no limiar deveria ficar apta: %v", err)
	}
	if status := statusOf(t, canMarkReady(statusTerritorialMaturing, 10, 10)); status != http.StatusConflict {
		t.Errorf("sem validação territorial deveria ser 409, foi %d", status)
	}
	if status := statusOf(t, canMarkReady(statusTerritoriallyValid, 9, 10)); status != http.StatusConflict {
		t.Errorf("abaixo do limiar deveria ser 409, foi %d", status)
	}
}

func TestCanSupportDemand(t *testing.T) {
	if err := canSupportDemand("Coleta", "territorio-1", "territorio-1"); err != nil {
		t.Errorf("apoio no território durante Coleta deveria passar: %v", err)
	}
	if status := statusOf(t, canSupportDemand("Votação", "territorio-1", "territorio-1")); status != http.StatusConflict {
		t.Errorf("apoio fora da Coleta deveria ser 409, foi %d", status)
	}
	if status := statusOf(t, canSupportDemand("Coleta", "", "territorio-1")); status != http.StatusForbidden {
		t.Errorf("apoio sem vínculo territorial deveria ser 403, foi %d", status)
	}
	if status := statusOf(t, canSupportDemand("Coleta", "territorio-2", "territorio-1")); status != http.StatusForbidden {
		t.Errorf("apoio de outro território deveria ser 403, foi %d", status)
	}
}

func TestCanGroup(t *testing.T) {
	base := func() (groupFacts, groupFacts) {
		src := groupFacts{ID: "a", CycleID: "c1", TerritoryID: "t1", Status: statusReceived}
		tgt := groupFacts{ID: "b", CycleID: "c1", TerritoryID: "t1", Status: statusReceived}
		return src, tgt
	}

	if src, tgt := base(); canGroup(src, tgt) != nil {
		t.Error("agrupamento válido no mesmo ciclo/território deveria passar")
	}

	src, tgt := base()
	src.Status = statusGrouped
	if statusOf(t, canGroup(src, tgt)) != http.StatusConflict {
		t.Error("origem já agrupada deveria ser 409")
	}

	src, tgt = base()
	tgt.ID = src.ID
	if statusOf(t, canGroup(src, tgt)) != http.StatusBadRequest {
		t.Error("agrupar em si mesma deveria ser 400")
	}

	src, tgt = base()
	tgt.CycleID = "c2"
	if statusOf(t, canGroup(src, tgt)) != http.StatusConflict {
		t.Error("ciclos diferentes deveria ser 409")
	}

	src, tgt = base()
	tgt.TerritoryID = "t2"
	if statusOf(t, canGroup(src, tgt)) != http.StatusConflict {
		t.Error("territórios diferentes deveria ser 409 (ainda não habilitado)")
	}
}

func TestCanFork(t *testing.T) {
	// op.DemandsOpen só é verdadeiro na fase Coleta.
	if err := canFork("Coleta", statusReceived, ""); err != nil {
		t.Errorf("fork na Coleta de demanda canônica deveria passar: %v", err)
	}
	if statusOf(t, canFork("Votação", statusReceived, "")) != http.StatusConflict {
		t.Error("fork fora da Coleta deveria ser 409")
	}
	if statusOf(t, canFork("Coleta", statusGrouped, "")) != http.StatusConflict {
		t.Error("fork de demanda agrupada deveria ser 409")
	}
	if statusOf(t, canFork("Coleta", statusCompleted, "")) != http.StatusConflict {
		t.Error("fork de demanda terminal deveria ser 409")
	}
}
