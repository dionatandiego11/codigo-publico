package op

import (
	"crypto/sha256"
	"encoding/binary"
	"net/http"
	"sort"

	"codigo-publico/backend/internal/web"
)

// sortition_policy.go — o sorteio auditável do conselho territorial. É a peça
// mais carregada de legitimidade (Manin: o sorteio é o método democrático de
// seleção, FUNDAMENTACAO §4): por isso precisa ser *verificável*, não confiável.
//
// O sorteio é determinístico a partir de uma seed pública e imprevisível: dada a
// lista de inscritos e a seed, qualquer pessoa reproduz e confere o resultado.
// Não há aleatoriedade oculta no servidor. A imprevisibilidade vem da fonte da
// seed (ex.: hash de bloco futuro, número da loteria) — registrada na auditoria
// ANTES de ser conhecida, junto do hash da lista. Ver docs/PROTOCOLO-OP.md §15.

// rankedCandidate é um inscrito com seu valor de ordenação derivado da seed.
type rankedCandidate struct {
	id   string
	hash [32]byte
}

// SortitionRanking ordena TODOS os inscritos pelo hash de (seed || id). É a base
// auditável: o conselho são os primeiros da ordem, e a ordem inteira fica
// disponível para conferência (inclusive a fila de suplência).
//
// A ordenação por SHA-256 da concatenação seed+id é uniforme e incapturável: sem
// conhecer a seed, ninguém prevê a posição; conhecida a seed, todos a recomputam.
// Empates de hash (improváveis) são desempatados pelo id, para determinismo total.
func SortitionRanking(inscritos []string, seed string) []string {
	ranked := make([]rankedCandidate, len(inscritos))
	for i, id := range inscritos {
		h := sha256.New()
		h.Write([]byte(seed))
		h.Write([]byte{0}) // separador: evita colisão seed+id ambígua
		h.Write([]byte(id))
		var sum [32]byte
		copy(sum[:], h.Sum(nil))
		ranked[i] = rankedCandidate{id: id, hash: sum}
	}

	sort.Slice(ranked, func(a, b int) bool {
		if c := compareHash(ranked[a].hash, ranked[b].hash); c != 0 {
			return c < 0
		}
		return ranked[a].id < ranked[b].id
	})

	order := make([]string, len(ranked))
	for i, c := range ranked {
		order[i] = c.id
	}
	return order
}

// Sortition seleciona o conselho: os primeiros `size` da ordem auditável. Se há
// menos inscritos que assentos, todos servem (conselho menor, ainda determinístico).
// Zero inscritos não é erro aqui — o território vai a modo-assembleia (decidido
// fora desta política, PROTOCOLO-OP §2.3).
func Sortition(inscritos []string, seed string, size int) ([]string, error) {
	if seed == "" {
		return nil, web.NewError(http.StatusBadRequest, "sorteio exige uma seed pública (auditável)")
	}
	if size < 1 {
		return nil, web.NewError(http.StatusBadRequest, "tamanho do conselho deve ser ao menos 1")
	}

	order := SortitionRanking(inscritos, seed)
	if len(order) <= size {
		return order, nil
	}
	return order[:size], nil
}

// VerifySortition recomputa o sorteio e confere se `claimed` é exatamente o
// conselho esperado para a seed e o tamanho dados. É a função que um auditor (ou
// qualquer cidadão) roda para validar um resultado publicado.
func VerifySortition(inscritos []string, seed string, size int, claimed []string) bool {
	expected, err := Sortition(inscritos, seed, size)
	if err != nil {
		return false
	}
	if len(expected) != len(claimed) {
		return false
	}
	for i := range expected {
		if expected[i] != claimed[i] {
			return false
		}
	}
	return true
}

// compareHash compara dois hashes como inteiros big-endian: <0, 0 ou >0.
func compareHash(a, b [32]byte) int {
	for i := 0; i < 32; i += 8 {
		ai := binary.BigEndian.Uint64(a[i : i+8])
		bi := binary.BigEndian.Uint64(b[i : i+8])
		if ai != bi {
			if ai < bi {
				return -1
			}
			return 1
		}
	}
	return 0
}
