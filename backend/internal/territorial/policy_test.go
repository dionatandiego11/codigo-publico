package territorial

import (
	"errors"
	"net/http"
	"testing"
	"time"

	"codigo-publico/backend/internal/web"
)

// statusOf extrai o status HTTP de um web.Error; 0 quando err é nil.
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

func TestDecisionAuthority(t *testing.T) {
	cases := []struct {
		name        string
		auth        DecisionAuthority
		canDecide   bool
		isRecursal  bool
	}{
		{"sysadmin pode tudo", DecisionAuthority{IsSysadmin: true}, true, true},
		{"maintainer geral decide e é recursal", DecisionAuthority{IsGeneralMaintainer: true}, true, true},
		{"maintainer territorial decide mas não é recursal", DecisionAuthority{IsTerritorialMaintainerHere: true}, true, false},
		{"cidadão comum não decide nem recorre", DecisionAuthority{}, false, false},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := tc.auth.CanDecideForTerritory(); got != tc.canDecide {
				t.Errorf("CanDecideForTerritory = %v, esperava %v", got, tc.canDecide)
			}
			if got := tc.auth.IsGeneralInstance(); got != tc.isRecursal {
				t.Errorf("IsGeneralInstance = %v, esperava %v", got, tc.isRecursal)
			}
		})
	}
}

func TestResolveApprovalTrustLevel(t *testing.T) {
	cases := []struct {
		name      string
		bondType  string
		requested string
		want      string
		wantErr   int
	}{
		{"morador sem nível assume T3", BondTypeResident, "", "T3", 0},
		{"trabalhador sem nível assume T1", BondTypeWorker, "", "T1", 0},
		{"estudante sem nível assume T1", BondTypeStudent, "", "T1", 0},
		{"morador pode chegar a T4", BondTypeResident, "T4", "T4", 0},
		{"trabalhador não passa de T2", BondTypeWorker, "T3", "", http.StatusBadRequest},
		{"estudante não passa de T2", BondTypeStudent, "T4", "", http.StatusBadRequest},
		{"nível inexistente é rejeitado", BondTypeResident, "T9", "", http.StatusBadRequest},
		{"trabalhador em T2 é aceito", BondTypeWorker, "T2", "T2", 0},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, err := ResolveApprovalTrustLevel(tc.bondType, tc.requested)
			if status := statusOf(t, err); status != tc.wantErr {
				t.Fatalf("status = %d, esperava %d", status, tc.wantErr)
			}
			if got != tc.want {
				t.Errorf("nível = %q, esperava %q", got, tc.want)
			}
		})
	}
}

func TestCanApproveOrReject(t *testing.T) {
	cases := []struct {
		name       string
		bondStatus string
		approve    bool
		reason     string
		wantErr    int
	}{
		{"aprovar pendente", BondStatusPending, true, "", 0},
		{"recusar pendente com motivo", BondStatusPending, false, "fora do território", 0},
		{"recusar pendente sem motivo é proibido", BondStatusPending, false, "", http.StatusBadRequest},
		{"não decide vínculo já aprovado", BondStatusApproved, true, "", http.StatusConflict},
		{"não decide vínculo já recusado", BondStatusRejected, true, "", http.StatusConflict},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if status := statusOf(t, CanApproveOrReject(tc.bondStatus, tc.approve, tc.reason)); status != tc.wantErr {
				t.Errorf("status = %d, esperava %d", status, tc.wantErr)
			}
		})
	}
}

func TestCanAppeal(t *testing.T) {
	cases := []struct {
		name       string
		bondStatus string
		isOwner    bool
		wantErr    int
	}{
		{"dono recorre de recusa", BondStatusRejected, true, 0},
		{"não-dono não recorre", BondStatusRejected, false, http.StatusForbidden},
		{"não cabe recurso de vínculo aprovado", BondStatusApproved, true, http.StatusConflict},
		{"não cabe recurso de vínculo pendente", BondStatusPending, true, http.StatusConflict},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if status := statusOf(t, CanAppeal(tc.bondStatus, tc.isOwner)); status != tc.wantErr {
				t.Errorf("status = %d, esperava %d", status, tc.wantErr)
			}
		})
	}
}

func TestCanContest(t *testing.T) {
	const territoryA = "terr-a"
	const territoryB = "terr-b"

	base := ContestEligibility{
		BondStatus:            BondStatusApproved,
		IsOwnBond:             false,
		ContestantBondStatus:  BondStatusApproved,
		ContestantTerritoryID: territoryA,
		BondTerritoryID:       territoryA,
	}

	cases := []struct {
		name    string
		mutate  func(e *ContestEligibility)
		wantErr int
	}{
		{"contestação válida no mesmo território", func(*ContestEligibility) {}, 0},
		{"só vínculo aprovado é contestável", func(e *ContestEligibility) { e.BondStatus = BondStatusPending }, http.StatusConflict},
		{"ninguém contesta o próprio vínculo", func(e *ContestEligibility) { e.IsOwnBond = true }, http.StatusBadRequest},
		{"contestante sem vínculo aprovado é barrado", func(e *ContestEligibility) { e.ContestantBondStatus = BondStatusPending }, http.StatusForbidden},
		{"contestante de outro território é barrado", func(e *ContestEligibility) { e.ContestantTerritoryID = territoryB }, http.StatusForbidden},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			e := base
			tc.mutate(&e)
			if status := statusOf(t, CanContest(e)); status != tc.wantErr {
				t.Errorf("status = %d, esperava %d", status, tc.wantErr)
			}
		})
	}
}

func TestCanReopenContestation(t *testing.T) {
	now := time.Date(2026, 6, 13, 0, 0, 0, 0, time.UTC)

	cases := []struct {
		name          string
		lastUpheldAt  time.Time
		hasLastUpheld bool
		hasNewFact    bool
		wantErr       int
	}{
		{"sem decisão anterior pode contestar", time.Time{}, false, false, 0},
		{"dentro dos 180 dias é barrado", now.Add(-30 * 24 * time.Hour), true, false, http.StatusConflict},
		{"fato novo ignora o descanso", now.Add(-30 * 24 * time.Hour), true, true, 0},
		{"após 180 dias pode recontestar", now.Add(-181 * 24 * time.Hour), true, false, 0},
		{"exatamente no limite ainda barra", now.Add(-179 * 24 * time.Hour), true, false, http.StatusConflict},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			err := CanReopenContestation(tc.lastUpheldAt, tc.hasLastUpheld, now, tc.hasNewFact)
			if status := statusOf(t, err); status != tc.wantErr {
				t.Errorf("status = %d, esperava %d", status, tc.wantErr)
			}
		})
	}
}

func TestValidateContestationOutcome(t *testing.T) {
	cases := []struct {
		name    string
		stage   string
		outcome string
		wantErr int
	}{
		{"primeira instância pode manter", ContestationStatusOpen, ContestationStatusUpheld, 0},
		{"primeira instância pode revogar", ContestationStatusOpen, ContestationStatusRevoked, 0},
		{"primeira instância pode escalar", ContestationStatusOpen, ContestationStatusEscalated, 0},
		{"primeira instância rejeita desfecho inválido", ContestationStatusOpen, "Qualquer", http.StatusBadRequest},
		{"recursal pode manter", ContestationStatusEscalated, ContestationStatusUpheld, 0},
		{"recursal pode revogar", ContestationStatusEscalated, ContestationStatusRevoked, 0},
		{"recursal não pode escalar de novo", ContestationStatusEscalated, ContestationStatusEscalated, http.StatusBadRequest},
		{"contestação já decidida não reabre", ContestationStatusUpheld, ContestationStatusRevoked, http.StatusConflict},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if status := statusOf(t, ValidateContestationOutcome(tc.stage, tc.outcome)); status != tc.wantErr {
				t.Errorf("status = %d, esperava %d", status, tc.wantErr)
			}
		})
	}
}
