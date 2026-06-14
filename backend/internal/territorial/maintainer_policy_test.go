package territorial

import (
	"net/http"
	"testing"
	"time"
)

func TestAppointmentInitialStatus(t *testing.T) {
	cases := []struct {
		source  string
		want    string
		wantErr int
	}{
		{AppointmentElection, MaintainerStatusActive, 0},
		{AppointmentLegislative, MaintainerStatusActive, 0},
		{AppointmentExecutive, MaintainerStatusProvisional, 0},   // executivo nunca nasce pleno
		{AppointmentEmergency, MaintainerStatusProvisional, 0},
		{"qualquer", "", http.StatusBadRequest},
	}

	for _, tc := range cases {
		t.Run(tc.source, func(t *testing.T) {
			got, err := AppointmentInitialStatus(tc.source)
			if status := statusOf(t, err); status != tc.wantErr {
				t.Fatalf("status = %d, esperava %d", status, tc.wantErr)
			}
			if got != tc.want {
				t.Errorf("status inicial = %q, esperava %q", got, tc.want)
			}
		})
	}
}

func TestMandateDuration(t *testing.T) {
	if MandateDuration(MaintainerStatusProvisional) != ProvisionalMandate {
		t.Error("provisório deveria usar mandato curto")
	}
	if MandateDuration(MaintainerStatusActive) != FullMandate {
		t.Error("ativo deveria usar mandato pleno")
	}
}

func TestCanAppoint(t *testing.T) {
	sysadmin := DecisionAuthority{IsSysadmin: true}
	general := DecisionAuthority{IsGeneralMaintainer: true}
	territorial := DecisionAuthority{IsTerritorialMaintainerHere: true}

	cases := []struct {
		name    string
		scope   string
		auth    DecisionAuthority
		wantErr int
	}{
		{"sysadmin nomeia geral", ScopeGeneral, sysadmin, 0},
		{"geral NÃO nomeia geral", ScopeGeneral, general, http.StatusForbidden},
		{"sysadmin nomeia territorial", ScopeTerritorial, sysadmin, 0},
		{"geral nomeia territorial", ScopeTerritorial, general, 0},
		{"territorial NÃO nomeia territorial", ScopeTerritorial, territorial, http.StatusForbidden},
		{"escopo inválido", "outro", sysadmin, http.StatusBadRequest},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if status := statusOf(t, CanAppoint(tc.scope, tc.auth)); status != tc.wantErr {
				t.Errorf("status = %d, esperava %d", status, tc.wantErr)
			}
		})
	}
}

func TestCanActivate(t *testing.T) {
	general := DecisionAuthority{IsGeneralMaintainer: true}
	territorial := DecisionAuthority{IsTerritorialMaintainerHere: true}

	cases := []struct {
		name    string
		current string
		auth    DecisionAuthority
		wantErr int
	}{
		{"geral ratifica provisório", MaintainerStatusProvisional, general, 0},
		{"territorial não ratifica", MaintainerStatusProvisional, territorial, http.StatusForbidden},
		{"não ratifica quem já é ativo", MaintainerStatusActive, general, http.StatusConflict},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if status := statusOf(t, CanActivate(tc.current, tc.auth)); status != tc.wantErr {
				t.Errorf("status = %d, esperava %d", status, tc.wantErr)
			}
		})
	}
}

func TestCanRemoveForCause(t *testing.T) {
	general := DecisionAuthority{IsGeneralMaintainer: true}
	territorial := DecisionAuthority{IsTerritorialMaintainerHere: true}

	cases := []struct {
		name    string
		current string
		auth    DecisionAuthority
		wantErr int
	}{
		{"geral remove ativo", MaintainerStatusActive, general, 0},
		{"territorial não remove", MaintainerStatusActive, territorial, http.StatusForbidden},
		{"não remove já destituído", MaintainerStatusRemoved, general, http.StatusConflict},
		{"não remove expirado", MaintainerStatusExpired, general, http.StatusConflict},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if status := statusOf(t, CanRemoveForCause(tc.current, tc.auth)); status != tc.wantErr {
				t.Errorf("status = %d, esperava %d", status, tc.wantErr)
			}
		})
	}
}

func TestCanOpenRecall(t *testing.T) {
	if statusOf(t, CanOpenRecall(MaintainerStatusActive)) != 0 {
		t.Error("deveria permitir recall de maintainer ativo")
	}
	if statusOf(t, CanOpenRecall(MaintainerStatusProvisional)) != 0 {
		t.Error("deveria permitir recall de maintainer provisório")
	}
	if statusOf(t, CanOpenRecall(MaintainerStatusRemoved)) != http.StatusConflict {
		t.Error("não deveria permitir recall de quem já saiu")
	}
}

func TestRecallQuorum(t *testing.T) {
	cases := []struct {
		seniorBonds int
		want        int
	}{
		{0, 1},   // território sem base: 1 já decide
		{1, 1},   // 50% de 1 + 1 = 1 (floor)
		{2, 2},   // 1 + 1
		{3, 2},   // 1 + 1
		{10, 6},  // 5 + 1
		{100, 51},
	}

	for _, tc := range cases {
		got := RecallQuorum(tc.seniorBonds)
		if got != tc.want {
			t.Errorf("RecallQuorum(%d) = %d, esperava %d", tc.seniorBonds, got, tc.want)
		}
	}
}

func TestRecallReached(t *testing.T) {
	if !RecallReached(6, 6) {
		t.Error("6 assinaturas deveria atingir quórum 6")
	}
	if RecallReached(5, 6) {
		t.Error("5 não deveria atingir quórum 6")
	}
	if !RecallReached(7, 6) {
		t.Error("7 deveria superar quórum 6")
	}
}

func TestComputeTermEnd(t *testing.T) {
	start := time.Date(2026, 6, 13, 0, 0, 0, 0, time.UTC)
	if got := ComputeTermEnd(MaintainerStatusProvisional, start); got != start.Add(ProvisionalMandate) {
		t.Errorf("term provisório = %v", got)
	}
	if got := ComputeTermEnd(MaintainerStatusActive, start); got != start.Add(FullMandate) {
		t.Errorf("term pleno = %v", got)
	}
}

func TestIsSeniorBond(t *testing.T) {
	for _, lvl := range []string{"T3", "T4"} {
		if !IsSeniorBond(lvl) {
			t.Errorf("%s deveria ser sênior", lvl)
		}
	}
	for _, lvl := range []string{"T0", "T1", "T2"} {
		if IsSeniorBond(lvl) {
			t.Errorf("%s não deveria ser sênior", lvl)
		}
	}
}
