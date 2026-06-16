package op

import (
	"net/http"
	"strings"

	"codigo-publico/backend/internal/web"
)

// institutional_policy.go — o filtro institucional do Legislativo (PROTOCOLO-OP
// §8, Fix 2). O que era um filtro único vira DOIS atos com consequências
// diferentes:
//
//   - admissibilidade: recusa por FUNDAMENTO FORMAL (lista fechada) → caminho de
//     retorno. Legítima, justificada e contestável.
//   - veto político: recusa FORA da lista → não é filtro, é derrubar a vontade
//     popular já votada; abre INCIDENTE PÚBLICO de divergência institucional.
//
// É democracia monitória aplicada: não se obriga a Câmara a obedecer, mas
// torna-se impossível derrubar a vontade popular em silêncio. O kernel proíbe o
// veto SILENCIOSO, não o veto fundamentado.

// InstitutionalGround é um fundamento formal de inadmissibilidade — a lista é
// FECHADA: só estes motivos contam como filtro legítimo.
type InstitutionalGround string

const (
	GroundNone             InstitutionalGround = ""
	GroundUnconstitutional InstitutionalGround = "inconstitucional"
	GroundOutOfCompetence  InstitutionalGround = "fora_da_competencia"
	GroundNoFunding        InstitutionalGround = "sem_fonte_de_custeio"
	GroundExceedsEnvelope  InstitutionalGround = "excede_envelope"
	GroundDependsOnOther   InstitutionalGround = "depende_de_outro_ente"
)

// IsFormalGround indica se o fundamento pertence à lista fechada de admissibilidade.
func IsFormalGround(g InstitutionalGround) bool {
	switch g {
	case GroundUnconstitutional, GroundOutOfCompetence, GroundNoFunding, GroundExceedsEnvelope, GroundDependsOnOther:
		return true
	default:
		return false
	}
}

// InstitutionalOutcome é o desfecho classificado da decisão institucional.
type InstitutionalOutcome string

const (
	OutcomeAdmitted      InstitutionalOutcome = "admitida"      // segue para a matriz
	OutcomeFiltered      InstitutionalOutcome = "filtrada"      // admissibilidade formal → retorno
	OutcomePoliticalVeto InstitutionalOutcome = "veto_politico" // → incidente público
)

// InstitutionalDecision são os fatos da decisão do Maintainer Geral sobre uma
// proposta já priorizada pela votação popular.
type InstitutionalDecision struct {
	Approve bool                // admitir na matriz?
	Ground  InstitutionalGround // fundamento formal (apenas em recusa)
	Reason  string              // justificativa pública (sempre obrigatória)
}

// InstitutionalResult é o desfecho: classificação, se exige incidente público e
// a mensagem pública.
type InstitutionalResult struct {
	Outcome  InstitutionalOutcome
	Incident bool
	Message  string
}

// ClassifyInstitutionalDecision aplica o Fix 2:
//   - aprovar → admitida (vai à matriz);
//   - recusar COM fundamento formal → filtrada (caminho de retorno);
//   - recusar SEM fundamento formal → veto político (abre incidente público).
//
// Toda decisão exige justificativa pública — o kernel não admite recusa muda.
func ClassifyInstitutionalDecision(d InstitutionalDecision) (InstitutionalResult, error) {
	if strings.TrimSpace(d.Reason) == "" {
		return InstitutionalResult{}, web.NewError(http.StatusBadRequest, "toda decisão institucional exige justificativa pública")
	}

	if d.Approve {
		if d.Ground != GroundNone {
			return InstitutionalResult{}, web.NewError(http.StatusBadRequest, "aprovação não admite fundamento de recusa")
		}
		return InstitutionalResult{OutcomeAdmitted, false, "proposta admitida na matriz orçamentária"}, nil
	}

	if IsFormalGround(d.Ground) {
		return InstitutionalResult{
			OutcomeFiltered, false,
			"recusa por fundamento formal de admissibilidade (" + string(d.Ground) + "); segue caminho de retorno",
		}, nil
	}

	// Recusa fora da lista fechada: não é filtro, é veto político sobre a
	// vontade popular — abre incidente público de divergência institucional.
	return InstitutionalResult{
		OutcomePoliticalVeto, true,
		"recusa fora dos fundamentos formais: veto político sobre decisão popular — registra incidente público de divergência",
	}, nil
}
