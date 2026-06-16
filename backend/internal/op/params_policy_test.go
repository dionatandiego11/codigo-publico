package op

import (
	"errors"
	"net/http"
	"testing"
	"time"

	"codigo-publico/backend/internal/web"
)

// statusOf extrai o status HTTP de um web.Error (0 quando não há erro).
// Compartilhado pelos testes do pacote op.
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

func TestDefaultRegimentoIsValid(t *testing.T) {
	if err := DefaultRegimento().Validate(); err != nil {
		t.Fatalf("o regimento default deveria ser válido, mas: %v", err)
	}
}

func TestCarenciaShareComplementsEqual(t *testing.T) {
	r := DefaultRegimento()
	if r.EqualSharePct+r.CarenciaSharePct() != 100 {
		t.Errorf("piso + carência = %d, esperava 100", r.EqualSharePct+r.CarenciaSharePct())
	}
}

// TestRegimentoRejectsOutOfRange é o teste constitucional central: cada parâmetro
// fora da faixa comum deve ser recusado. O município escolhe o número; não pode
// estourar o piso/teto que protege o kernel.
func TestRegimentoRejectsOutOfRange(t *testing.T) {
	mutate := func(f func(*RegimentoLocal)) RegimentoLocal {
		r := DefaultRegimento()
		f(&r)
		return r
	}

	cases := []struct {
		name string
		reg  RegimentoLocal
	}{
		{"conselho de 2 vira frágil demais", mutate(func(r *RegimentoLocal) { r.CouncilSize = MinCouncilSize - 1 })},
		{"conselho de 8 é grande demais", mutate(func(r *RegimentoLocal) { r.CouncilSize = MaxCouncilSize + 1 })},
		{"recondução dupla perpetua", mutate(func(r *RegimentoLocal) { r.ConsecutiveTerms = MaxConsecutiveTerms + 1 })},
		{"apoio 0% é simbólico", mutate(func(r *RegimentoLocal) { r.SupportThresholdPct = MinSupportThresholdPct - 1 })},
		{"apoio 11% é proibitivo", mutate(func(r *RegimentoLocal) { r.SupportThresholdPct = MaxSupportThresholdPct + 1 })},
		{"quórum de votação 4% é baixo demais", mutate(func(r *RegimentoLocal) { r.VotingQuorumPct = MinVotingQuorumPct - 1 })},
		{"quórum de votação 26% inviabiliza", mutate(func(r *RegimentoLocal) { r.VotingQuorumPct = MaxVotingQuorumPct + 1 })},
		{"recall 14% é simbólico", mutate(func(r *RegimentoLocal) { r.RecallQuorumPct = MinRecallQuorumPct - 1 })},
		{"recall 41% é quase impossível", mutate(func(r *RegimentoLocal) { r.RecallQuorumPct = MaxRecallQuorumPct + 1 })},
		{"piso igual 29% esmaga a igualdade", mutate(func(r *RegimentoLocal) { r.EqualSharePct = MinEqualSharePct - 1 })},
		{"piso igual 71% esmaga a carência", mutate(func(r *RegimentoLocal) { r.EqualSharePct = MaxEqualSharePct + 1 })},
		{"estruturante 41% engole o território", mutate(func(r *RegimentoLocal) { r.StructuringPct = MaxStructuringPct + 1 })},
		{"inscrição abaixo do piso", mutate(func(r *RegimentoLocal) { r.InscriptionWindow = MinInscriptionWindow - time.Hour })},
		{"maturação abaixo do piso", mutate(func(r *RegimentoLocal) { r.MaturationWindow = MinMaturationWindow - time.Hour })},
		{"votação abaixo do piso", mutate(func(r *RegimentoLocal) { r.VotingWindow = MinVotingWindow - time.Hour })},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if status := statusOf(t, tc.reg.Validate()); status != http.StatusBadRequest {
				t.Errorf("status = %d, esperava 400 (faixa comum violada)", status)
			}
		})
	}
}

// TestRegimentoAcceptsBoundaries: os extremos exatos da faixa são válidos — o
// piso e o teto pertencem ao que é permitido.
func TestRegimentoAcceptsBoundaries(t *testing.T) {
	r := DefaultRegimento()
	r.CouncilSize = MinCouncilSize
	r.StructuringPct = MinStructuringPct // 0% estruturante é permitido
	r.EqualSharePct = MaxEqualSharePct
	r.RecallQuorumPct = MaxRecallQuorumPct
	r.InscriptionWindow = MinInscriptionWindow
	if err := r.Validate(); err != nil {
		t.Errorf("extremos da faixa deveriam ser válidos, mas: %v", err)
	}
}
