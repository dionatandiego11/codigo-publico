package op

import (
	"net/http"
	"testing"
)

func admissible() ProposalFacts {
	return ProposalFacts{
		EstimatedCostCents:  100_00,
		AvailableCents:      1000_00,
		MunicipalCompetence: true,
		Legal:               true,
		HasFundingSource:    true,
	}
}

func TestBreakerPasses(t *testing.T) {
	res := EvaluateCircuitBreaker(admissible())
	if !res.Passes || res.Verdict != BreakerPass {
		t.Fatalf("proposta admissível deveria passar: %+v", res)
	}
	if err := AdmitProposal(admissible()); err != nil {
		t.Errorf("AdmitProposal não deveria errar: %v", err)
	}
}

func TestBreakerBlocksEachDimension(t *testing.T) {
	cases := []struct {
		name string
		mut  func(*ProposalFacts)
		want BreakerVerdict
	}{
		{"ilegal", func(f *ProposalFacts) { f.Legal = false }, BreakerIllegal},
		{"fora da competência", func(f *ProposalFacts) { f.MunicipalCompetence = false }, BreakerOutOfCompetence},
		{"sem fonte de custeio", func(f *ProposalFacts) { f.HasFundingSource = false }, BreakerDependsOnOther},
		{"excede envelope", func(f *ProposalFacts) { f.EstimatedCostCents = f.AvailableCents + 1 }, BreakerExceedsEnvelope},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			f := admissible()
			tc.mut(&f)
			res := EvaluateCircuitBreaker(f)
			if res.Passes {
				t.Fatalf("%s deveria barrar", tc.name)
			}
			if res.Verdict != tc.want {
				t.Errorf("veredito = %q, esperava %q", res.Verdict, tc.want)
			}
			if status := statusOf(t, AdmitProposal(f)); status != http.StatusUnprocessableEntity {
				t.Errorf("AdmitProposal deveria ser 422, foi %d", status)
			}
		})
	}
}

// TestBreakerOrdering: a ilegalidade tem precedência sobre o orçamento — uma
// proposta ilegal E acima do envelope é barrada COMO ilegal (a barreira mais
// fundamental primeiro).
func TestBreakerOrdering(t *testing.T) {
	f := admissible()
	f.Legal = false
	f.EstimatedCostCents = f.AvailableCents + 1
	if v := EvaluateCircuitBreaker(f).Verdict; v != BreakerIllegal {
		t.Errorf("veredito = %q, esperava precedência da ilegalidade", v)
	}
}

// TestBreakerSkipsBudgetWhenUnknown: sem envelope aferido (AvailableCents <= 0),
// não se nega pela dimensão orçamentária — não se reprova por número inexistente.
func TestBreakerSkipsBudgetWhenUnknown(t *testing.T) {
	f := admissible()
	f.AvailableCents = 0
	f.EstimatedCostCents = 999_999_00
	if !EvaluateCircuitBreaker(f).Passes {
		t.Error("sem envelope aferido, a dimensão orçamentária deveria ser pulada")
	}
}

// TestBreakerCostEqualsAvailable: gastar exatamente o disponível é admissível
// (não excede).
func TestBreakerCostEqualsAvailable(t *testing.T) {
	f := admissible()
	f.EstimatedCostCents = f.AvailableCents
	if !EvaluateCircuitBreaker(f).Passes {
		t.Error("custo igual ao disponível não excede o envelope")
	}
}
