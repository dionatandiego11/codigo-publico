package op

import (
	"net/http"
	"sort"
	"testing"
)

func inscritosFixture(n int) []string {
	ids := make([]string, n)
	for i := range ids {
		ids[i] = "cidadao-" + itoa(i)
	}
	return ids
}

// TestSortitionDeterministic: mesma seed e mesma lista → mesmo conselho, sempre.
// É a base da verificabilidade (não há aleatoriedade oculta).
func TestSortitionDeterministic(t *testing.T) {
	in := inscritosFixture(20)
	a, _ := Sortition(in, "seed-publica-123", 5)
	b, _ := Sortition(in, "seed-publica-123", 5)
	if len(a) != 5 {
		t.Fatalf("conselho com %d membros, esperava 5", len(a))
	}
	for i := range a {
		if a[i] != b[i] {
			t.Fatalf("sorteio não determinístico: %v != %v", a, b)
		}
	}
}

// TestSortitionVerifiable: o auditor recomputa e confirma o resultado correto, e
// rejeita um resultado adulterado.
func TestSortitionVerifiable(t *testing.T) {
	in := inscritosFixture(30)
	seed := "bloco-futuro-0xabc"
	council, _ := Sortition(in, seed, 5)

	if !VerifySortition(in, seed, 5, council) {
		t.Error("o conselho correto deveria ser verificado como válido")
	}

	tampered := append([]string(nil), council...)
	tampered[0] = "cidadao-999" // alguém que não estava na lista
	if VerifySortition(in, seed, 5, tampered) {
		t.Error("um conselho adulterado NÃO deveria passar na verificação")
	}
}

// TestSortitionSeedChangesResult: trocar a seed muda o conselho — a seed pública
// é o que torna o resultado imprevisível antes de ser conhecida.
func TestSortitionSeedChangesResult(t *testing.T) {
	in := inscritosFixture(50)
	a, _ := Sortition(in, "seed-A", 5)
	b, _ := Sortition(in, "seed-B", 5)

	same := true
	for i := range a {
		if a[i] != b[i] {
			same = false
			break
		}
	}
	if same {
		t.Error("seeds diferentes deveriam (com altíssima probabilidade) gerar conselhos diferentes")
	}
}

// TestSortitionRankingIsPermutation: a ordem auditável contém exatamente os
// inscritos — ninguém some, ninguém é inventado, ninguém aparece duas vezes.
func TestSortitionRankingIsPermutation(t *testing.T) {
	in := inscritosFixture(25)
	order := SortitionRanking(in, "seed-x")

	if len(order) != len(in) {
		t.Fatalf("ordem tem %d, esperava %d", len(order), len(in))
	}
	got := append([]string(nil), order...)
	want := append([]string(nil), in...)
	sort.Strings(got)
	sort.Strings(want)
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("a ordem não é uma permutação dos inscritos: %v", order)
		}
	}
}

// TestSortitionFewerThanSeats: com menos inscritos que assentos, todos servem.
func TestSortitionFewerThanSeats(t *testing.T) {
	in := inscritosFixture(3)
	council, err := Sortition(in, "seed", 5)
	if err != nil {
		t.Fatalf("não deveria errar: %v", err)
	}
	if len(council) != 3 {
		t.Errorf("conselho com %d, esperava todos os 3 inscritos", len(council))
	}
}

func TestSortitionEmptyInscritos(t *testing.T) {
	council, err := Sortition(nil, "seed", 5)
	if err != nil {
		t.Fatalf("lista vazia não é erro de sorteio (vai a modo-assembleia): %v", err)
	}
	if len(council) != 0 {
		t.Errorf("sem inscritos, conselho deveria ser vazio")
	}
}

func TestSortitionRejectsEmptySeed(t *testing.T) {
	if status := statusOf(t, mustErr(Sortition(inscritosFixture(5), "", 3))); status != http.StatusBadRequest {
		t.Errorf("seed vazia deveria ser 400, foi %d", status)
	}
}

func TestSortitionRejectsZeroSize(t *testing.T) {
	if status := statusOf(t, mustErr(Sortition(inscritosFixture(5), "seed", 0))); status != http.StatusBadRequest {
		t.Errorf("tamanho 0 deveria ser 400, foi %d", status)
	}
}

// mustErr descarta o valor e devolve só o erro, para usar com statusOf.
func mustErr(_ []string, err error) error { return err }
