package op

import (
	"net/http"
	"testing"
)

func identityIdx(n int) []int {
	idx := make([]int, n)
	for i := range idx {
		idx[i] = i
	}
	return idx
}

// TestDistributeEqualConserves: rateio igual soma exato e difere no máximo 1
// centavo entre territórios (o resto da divisão).
func TestDistributeEqualConserves(t *testing.T) {
	cases := []struct {
		pool int64
		n    int
	}{
		{100, 3}, {1000, 7}, {1, 5}, {0, 4}, {999999, 13},
	}
	for _, tc := range cases {
		parts := distributeEqual(tc.pool, identityIdx(tc.n))
		var sum, min, max int64
		min = 1 << 62
		for _, p := range parts {
			sum += p
			if p < min {
				min = p
			}
			if p > max {
				max = p
			}
		}
		if sum != tc.pool {
			t.Errorf("pool=%d n=%d: soma=%d (perdeu/criou centavo)", tc.pool, tc.n, sum)
		}
		if max-min > 1 {
			t.Errorf("pool=%d n=%d: diferença %d > 1 centavo", tc.pool, tc.n, max-min)
		}
	}
}

// TestDistributeProportional: a carência é proporcional ao peso, soma exata.
func TestDistributeProportional(t *testing.T) {
	// 100 centavos, pesos 1:3 → 25:75 exatos.
	parts := distributeProportional(100, []int64{1, 3}, identityIdx(2))
	if parts[0] != 25 || parts[1] != 75 {
		t.Errorf("esperava [25 75], obtive %v", parts)
	}

	// 10 centavos, pesos iguais 1:1:1 → 4:3:3 (resto vai ao primeiro por id).
	p2 := distributeProportional(10, []int64{1, 1, 1}, identityIdx(3))
	var sum int64
	for _, p := range p2 {
		sum += p
	}
	if sum != 10 {
		t.Errorf("soma=%d, esperava 10", sum)
	}
	if p2[0] != 4 {
		t.Errorf("o resto deveria ir ao primeiro território: %v", p2)
	}
}

// TestDistributeProportionalZeroWeights: sem dado de carência, vira rateio igual
// (a parcela de carência nunca some).
func TestDistributeProportionalZeroWeights(t *testing.T) {
	parts := distributeProportional(90, []int64{0, 0, 0}, identityIdx(3))
	for _, p := range parts {
		if p != 30 {
			t.Errorf("fallback igual falhou: %v", parts)
		}
	}
}

// TestSplitEnvelopeConserves: structuring + soma das fatias = total, sempre.
func TestSplitEnvelopeConserves(t *testing.T) {
	reg := DefaultRegimento()
	terr := []TerritoryWeight{
		{"centro", 1}, {"norte", 5}, {"sul", 3}, {"leste", 0}, {"rural", 8},
	}
	for _, total := range []int64{1000000, 1, 7777777, 250000} {
		split, err := SplitEnvelope(total, reg, terr)
		if err != nil {
			// total=1 com 5 territórios pode ser insuficiente; aceitável.
			if statusOf(t, err) == http.StatusUnprocessableEntity {
				continue
			}
			t.Fatalf("total=%d erro inesperado: %v", total, err)
		}
		var sumTerr int64
		for _, te := range split.Territories {
			if te.Equal+te.Carencia != te.Total {
				t.Errorf("fatia inconsistente: %+v", te)
			}
			sumTerr += te.Total
		}
		if split.Structuring+sumTerr != total {
			t.Errorf("total=%d: structuring(%d)+territorial(%d)=%d != total",
				total, split.Structuring, sumTerr, split.Structuring+sumTerr)
		}
		if sumTerr != split.Territorial {
			t.Errorf("soma das fatias %d != porção territorial %d", sumTerr, split.Territorial)
		}
	}
}

// TestSplitEnvelopePisoNuncaZero (kernel): com envelope suficiente, todo
// território recebe piso igual positivo.
func TestSplitEnvelopePisoNuncaZero(t *testing.T) {
	reg := DefaultRegimento()
	terr := []TerritoryWeight{{"a", 0}, {"b", 0}, {"c", 100}}
	split, err := SplitEnvelope(1000000, reg, terr)
	if err != nil {
		t.Fatalf("erro: %v", err)
	}
	for _, te := range split.Territories {
		if te.Equal <= 0 {
			t.Errorf("território %s ficou sem piso igual (%d)", te.TerritoryID, te.Equal)
		}
	}
}

// TestSplitEnvelopeInsufficientFails (kernel): se o piso não cabe, falha em vez
// de calar territórios.
func TestSplitEnvelopeInsufficientFails(t *testing.T) {
	reg := DefaultRegimento()
	terr := make([]TerritoryWeight, 10)
	for i := range terr {
		terr[i] = TerritoryWeight{TerritoryID: "t" + itoa(i)}
	}
	// total=20: estruturante=4, pool=16, equalPool=8 < 10 territórios.
	if status := statusOf(t, mustErrSplit(SplitEnvelope(20, reg, terr))); status != http.StatusUnprocessableEntity {
		t.Errorf("envelope insuficiente deveria ser 422, foi %d", status)
	}
}

// TestSplitEnvelopeOrderIndependent: a ordem de entrada dos territórios não muda
// o resultado (distribuição determinística por id).
func TestSplitEnvelopeOrderIndependent(t *testing.T) {
	reg := DefaultRegimento()
	a := []TerritoryWeight{{"centro", 1}, {"norte", 5}, {"sul", 3}}
	b := []TerritoryWeight{{"sul", 3}, {"centro", 1}, {"norte", 5}}

	sa, _ := SplitEnvelope(123456, reg, a)
	sb, _ := SplitEnvelope(123456, reg, b)

	byID := func(s EnvelopeSplit) map[string]int64 {
		m := map[string]int64{}
		for _, te := range s.Territories {
			m[te.TerritoryID] = te.Total
		}
		return m
	}
	ma, mb := byID(sa), byID(sb)
	for id, v := range ma {
		if mb[id] != v {
			t.Errorf("território %s: %d vs %d (dependeu da ordem de entrada)", id, v, mb[id])
		}
	}
}

func TestSplitEnvelopeRejectsBadInput(t *testing.T) {
	reg := DefaultRegimento()
	terr := []TerritoryWeight{{"a", 1}}

	if status := statusOf(t, mustErrSplit(SplitEnvelope(-1, reg, terr))); status != http.StatusBadRequest {
		t.Error("envelope negativo deveria ser 400")
	}
	if status := statusOf(t, mustErrSplit(SplitEnvelope(1000, reg, nil))); status != http.StatusBadRequest {
		t.Error("sem territórios deveria ser 400")
	}
	bad := DefaultRegimento()
	bad.CouncilSize = 99 // regimento inválido
	if status := statusOf(t, mustErrSplit(SplitEnvelope(1000, bad, terr))); status != http.StatusBadRequest {
		t.Error("regimento inválido deveria propagar 400")
	}
}

func mustErrSplit(_ EnvelopeSplit, err error) error { return err }
