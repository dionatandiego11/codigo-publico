package op

import (
	"net/http"
	"sort"

	"codigo-publico/backend/internal/web"
)

// envelope_policy.go — a divisão do envelope orçamentário em dois níveis, feita
// ANTES da votação para que a escassez seja conhecida e o circuit breaker tenha
// sentido (Fix 3, PROTOCOLO-OP §6).
//
//	Envelope do ciclo
//	├─ Porção estruturante  (StructuringPct)  → decidida na matriz municipal
//	└─ Porção territorial    (o restante)
//	     ├─ piso igual        (EqualSharePct)   → todo território recebe o mesmo
//	     └─ parcela carência  (o restante)      → proporcional ao peso de carência
//
// Toda a aritmética é em centavos (int64) e EXATA: a soma das partes é sempre
// igual ao total — nenhum centavo se perde na divisão (método do maior resto).

// TerritoryWeight é um território e seu peso de carência (≥0). Peso 0 significa
// "sem carência aferida"; se todos forem 0, a parcela de carência é rateada
// igualmente (fallback), nunca perdida.
type TerritoryWeight struct {
	TerritoryID    string `json:"territoryId"`
	CarenciaWeight int64  `json:"carenciaWeight"`
}

// TerritoryEnvelope é a fatia final de um território.
type TerritoryEnvelope struct {
	TerritoryID string `json:"territoryId"`
	Equal       int64  `json:"equal"`    // parte do piso igual
	Carencia    int64  `json:"carencia"` // parte da carência
	Total       int64  `json:"total"`    // Equal + Carencia
}

// EnvelopeSplit é o resultado da divisão do envelope do ciclo.
type EnvelopeSplit struct {
	Total       int64               `json:"total"`       // envelope do ciclo (centavos)
	Structuring int64               `json:"structuring"` // porção estruturante municipal
	Territorial int64               `json:"territorial"` // soma das fatias territoriais
	Territories []TerritoryEnvelope `json:"territories"` // fatia de cada território
}

// SplitEnvelope divide o envelope do ciclo conforme o regimento local. Garante o
// kernel "envelope territorial nunca zero": se o piso igual não puder dar ao
// menos 1 centavo a cada território, retorna erro (envelope insuficiente) em vez
// de calar territórios.
func SplitEnvelope(total int64, reg RegimentoLocal, territories []TerritoryWeight) (EnvelopeSplit, error) {
	if total < 0 {
		return EnvelopeSplit{}, web.NewError(http.StatusBadRequest, "envelope não pode ser negativo")
	}
	if len(territories) == 0 {
		return EnvelopeSplit{}, web.NewError(http.StatusBadRequest, "não há territórios para dividir o envelope")
	}
	if err := reg.Validate(); err != nil {
		return EnvelopeSplit{}, err
	}

	n := int64(len(territories))
	structuring := total * int64(reg.StructuringPct) / 100
	territorialPool := total - structuring
	equalPool := territorialPool * int64(reg.EqualSharePct) / 100
	carenciaPool := territorialPool - equalPool

	// Kernel: piso igual precisa dar ao menos 1 centavo a cada território.
	if equalPool < n {
		return EnvelopeSplit{}, web.NewError(http.StatusUnprocessableEntity,
			"envelope insuficiente para garantir piso igual a todos os territórios")
	}

	// Ordem estável por TerritoryID para que a distribuição do resto seja
	// determinística e auditável (independe da ordem de entrada).
	idx := make([]int, len(territories))
	for i := range idx {
		idx[i] = i
	}
	sort.Slice(idx, func(a, b int) bool {
		return territories[idx[a]].TerritoryID < territories[idx[b]].TerritoryID
	})

	weights := make([]int64, len(territories))
	for i, t := range territories {
		weights[i] = t.CarenciaWeight
	}

	equalParts := distributeEqual(equalPool, idx)
	carenciaParts := distributeProportional(carenciaPool, weights, idx)

	out := make([]TerritoryEnvelope, len(territories))
	for i, t := range territories {
		out[i] = TerritoryEnvelope{
			TerritoryID: t.TerritoryID,
			Equal:       equalParts[i],
			Carencia:    carenciaParts[i],
			Total:       equalParts[i] + carenciaParts[i],
		}
	}

	return EnvelopeSplit{
		Total:       total,
		Structuring: structuring,
		Territorial: territorialPool,
		Territories: out,
	}, nil
}

// distributeEqual reparte `pool` igualmente entre len(idx) territórios. O resto
// da divisão é dado, 1 centavo por vez, aos territórios na ordem de `idx` (id
// crescente) — soma exata, sem perder centavo.
func distributeEqual(pool int64, idx []int) []int64 {
	n := int64(len(idx))
	base := pool / n
	rem := pool % n

	out := make([]int64, len(idx))
	for rank, original := range idx {
		out[original] = base
		if int64(rank) < rem {
			out[original]++
		}
	}
	return out
}

// distributeProportional reparte `pool` proporcionalmente aos pesos, com o resto
// alocado pelo método do maior resto (os maiores restos fracionários recebem +1).
// Pesos todos zero → rateio igual (fallback: carência sem dado não some). Soma exata.
func distributeProportional(pool int64, weights []int64, idx []int) []int64 {
	var totalW int64
	for _, w := range weights {
		if w > 0 {
			totalW += w
		}
	}
	if totalW == 0 {
		return distributeEqual(pool, idx)
	}

	out := make([]int64, len(weights))
	remainders := make([]struct {
		original  int
		remainder int64
	}, 0, len(weights))

	var assigned int64
	for _, original := range idx {
		w := weights[original]
		if w < 0 {
			w = 0
		}
		exact := pool * w // numerador; quociente exato é exact/totalW
		out[original] = exact / totalW
		assigned += out[original]
		remainders = append(remainders, struct {
			original  int
			remainder int64
		}{original, exact % totalW})
	}

	leftover := pool - assigned
	// Maior resto primeiro; empate desempatado pela ordem de idx (id crescente),
	// já que `remainders` foi montado nessa ordem — sort estável preserva.
	sort.SliceStable(remainders, func(a, b int) bool {
		return remainders[a].remainder > remainders[b].remainder
	})
	for i := int64(0); i < leftover; i++ {
		out[remainders[i].original]++
	}

	return out
}
