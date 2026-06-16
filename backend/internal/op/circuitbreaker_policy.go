package op

import (
	"net/http"

	"codigo-publico/backend/internal/web"
)

// circuitbreaker_policy.go — o filtro jurídico-orçamentário (PROTOCOLO-OP §13). O
// breaker NÃO existe para humilhar nem matar a demanda: ele traduz, devolve,
// faseia ou transforma em reivindicação externa. Aqui ficam os desfechos como
// regra pura e testável; cada "não" carrega um caminho de retorno (PROTOCOLO §9).

type BreakerVerdict string

const (
	BreakerPass            BreakerVerdict = "passa"
	BreakerIllegal         BreakerVerdict = "inconstitucional"      // ilegal → bloquear, permitir reformulação
	BreakerOutOfCompetence BreakerVerdict = "fora_da_competencia"   // → reivindicação externa
	BreakerDependsOnOther  BreakerVerdict = "depende_de_outro_ente" // → pactuação regional
	BreakerExceedsEnvelope BreakerVerdict = "excede_envelope"       // → fases / ciclo plurianual
)

// ProposalFacts reúne os fatos de admissibilidade. Os booleanos são afirmações do
// filtro (maintainer/protocolo); o custo é confrontado com o sub-envelope
// disponível do território. AvailableCents <= 0 significa "orçamento não aferido"
// (ex.: envelope ainda não fixado): a dimensão orçamentária é então pulada, não
// reprovada — não se nega por um número que não existe.
type ProposalFacts struct {
	EstimatedCostCents  int64
	AvailableCents      int64
	MunicipalCompetence bool
	Legal               bool
	HasFundingSource    bool
}

// BreakerResult é o desfecho do filtro: o veredito, se passa e a mensagem pública.
type BreakerResult struct {
	Verdict BreakerVerdict
	Passes  bool
	Message string
}

// EvaluateCircuitBreaker aplica o filtro em ordem de fundamentalidade:
// legalidade → competência → fonte de custeio → orçamento. A primeira barreira
// encontrada é o desfecho (uma proposta ilegal não precisa caber no envelope para
// ser barrada). É a tradução direta das respostas possíveis do PROTOCOLO §13.
func EvaluateCircuitBreaker(f ProposalFacts) BreakerResult {
	if !f.Legal {
		return BreakerResult{BreakerIllegal, false,
			"proposta incompatível com regra constitucional ou legal; bloqueada, mas pode ser reformulada"}
	}
	if !f.MunicipalCompetence {
		return BreakerResult{BreakerOutOfCompetence, false,
			"fora da competência municipal; pode ser encaminhada como reivindicação externa a outro ente"}
	}
	if !f.HasFundingSource {
		return BreakerResult{BreakerDependsOnOther, false,
			"depende de outro ente federativo ou de fonte de custeio; cabe pactuação antes de prosseguir"}
	}
	if f.AvailableCents > 0 && f.EstimatedCostCents > f.AvailableCents {
		return BreakerResult{BreakerExceedsEnvelope, false,
			"custo excede o envelope disponível do território; divida em fases ou leve a ciclo plurianual"}
	}

	return BreakerResult{BreakerPass, true, "proposta admissível"}
}

// AdmitProposal converte o desfecho do breaker em erro de admissão (422) quando a
// proposta não passa, ou nil quando passa — atalho para uso direto no serviço.
func AdmitProposal(f ProposalFacts) error {
	res := EvaluateCircuitBreaker(f)
	if res.Passes {
		return nil
	}
	return web.NewError(http.StatusUnprocessableEntity, res.Message)
}
