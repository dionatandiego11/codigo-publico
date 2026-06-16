package op

import (
	"net/http"
	"testing"
)

func TestInstitutionalApprovalAdmits(t *testing.T) {
	res, err := ClassifyInstitutionalDecision(InstitutionalDecision{Approve: true, Reason: "atende ao interesse público"})
	if err != nil {
		t.Fatalf("aprovação fundamentada deveria passar: %v", err)
	}
	if res.Outcome != OutcomeAdmitted || res.Incident {
		t.Errorf("esperava admitida sem incidente, obtive %+v", res)
	}
}

func TestInstitutionalApprovalRejectsGround(t *testing.T) {
	_, err := ClassifyInstitutionalDecision(InstitutionalDecision{Approve: true, Ground: GroundUnconstitutional, Reason: "x"})
	if statusOf(t, err) != http.StatusBadRequest {
		t.Error("aprovar com fundamento de recusa deveria ser 400")
	}
}

// TestInstitutionalFormalFilter: recusa por qualquer fundamento da lista fechada é
// filtro de admissibilidade — sem incidente, com caminho de retorno.
func TestInstitutionalFormalFilter(t *testing.T) {
	grounds := []InstitutionalGround{
		GroundUnconstitutional, GroundOutOfCompetence, GroundNoFunding,
		GroundExceedsEnvelope, GroundDependsOnOther,
	}
	for _, g := range grounds {
		res, err := ClassifyInstitutionalDecision(InstitutionalDecision{Approve: false, Ground: g, Reason: "fundamento formal"})
		if err != nil {
			t.Fatalf("recusa formal (%s) deveria passar: %v", g, err)
		}
		if res.Outcome != OutcomeFiltered || res.Incident {
			t.Errorf("fundamento %s deveria filtrar sem incidente, obtive %+v", g, res)
		}
	}
}

// TestInstitutionalPoliticalVeto: recusa SEM fundamento formal (ou com motivo fora
// da lista) é veto político — abre incidente público.
func TestInstitutionalPoliticalVeto(t *testing.T) {
	cases := []InstitutionalDecision{
		{Approve: false, Ground: GroundNone, Reason: "não gostei"},
		{Approve: false, Ground: "porque sim", Reason: "discordância política"},
	}
	for _, d := range cases {
		res, err := ClassifyInstitutionalDecision(d)
		if err != nil {
			t.Fatalf("recusa política deveria classificar, não errar: %v", err)
		}
		if res.Outcome != OutcomePoliticalVeto || !res.Incident {
			t.Errorf("esperava veto político com incidente, obtive %+v", res)
		}
	}
}

func TestInstitutionalReasonRequired(t *testing.T) {
	for _, d := range []InstitutionalDecision{
		{Approve: true, Reason: "  "},
		{Approve: false, Ground: GroundUnconstitutional, Reason: ""},
	} {
		if statusOf(t, mustClassifyErr(ClassifyInstitutionalDecision(d))) != http.StatusBadRequest {
			t.Errorf("decisão sem justificativa deveria ser 400: %+v", d)
		}
	}
}

func mustClassifyErr(_ InstitutionalResult, err error) error { return err }
