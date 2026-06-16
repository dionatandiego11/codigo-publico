// Package op é a camada de decisão pura do Orçamento Participativo: as regras da
// esteira (parâmetros, sorteio do conselho, divisão do envelope) implementadas
// como funções puras — sem banco nem rede — e cobertas por testes constitucionais.
// Ver docs/PROTOCOLO-OP.md.
package op

import (
	"net/http"
	"time"

	"codigo-publico/backend/internal/web"
)

// params_policy.go crava as faixas comuns do regimento local. Seguindo o
// policentrismo de Ostrom — "a regra é comum, o número é local" — o kernel
// define piso e teto (constantes abaixo) e cada município escolhe o número
// dentro deles. A faixa existe para impedir que o parâmetro local burle o
// kernel: um conselho de 1 viraria "rei"; um recall de 90% seria impossível.
// Ver docs/PROTOCOLO-OP.md §1.

// Faixa do conselho territorial: ≥3 garante colegialidade (sem "rei"); ≤7
// mantém operável.
const (
	MinCouncilSize = 3
	MaxCouncilSize = 7
)

// Faixa de mandatos consecutivos do conselho: ao menos rotação total (0) e no
// máximo uma recondução (1). O kernel proíbe perpetuação.
const (
	MinConsecutiveTerms = 0
	MaxConsecutiveTerms = 1
)

// Faixas dos limiares populares, em pontos percentuais dos cidadãos vinculados.
const (
	// Apoio mínimo para uma demanda amadurecer: nunca simbólico (≥1%), nunca
	// proibitivo (≤10%).
	MinSupportThresholdPct = 1
	MaxSupportThresholdPct = 10

	// Quórum para validar a votação territorial: participação real (≥5%) sem
	// inviabilizar (≤25%).
	MinVotingQuorumPct = 5
	MaxVotingQuorumPct = 25

	// Quórum de recall: sempre possível (≤40%), nunca simbólico (≥15%).
	MinRecallQuorumPct = 15
	MaxRecallQuorumPct = 40
)

// Faixa do piso igual do envelope territorial (o restante, 100−piso, é carência).
// A simetria 30..70 garante que nem a igualdade nem a equidade sejam zeradas:
// nenhum território fica sem piso, e a carência sempre tem peso.
const (
	MinEqualSharePct = 30
	MaxEqualSharePct = 70
)

// Faixa da porção estruturante municipal: a maior parte do orçamento (≥60%) é
// sempre decidida no território.
const (
	MinStructuringPct = 0
	MaxStructuringPct = 40
)

// Pisos das janelas do calendário. O kernel impede que uma cidade comprima a
// participação a ponto de torná-la decorativa.
const (
	MinInscriptionWindow = 10 * 24 * time.Hour
	MinMaturationWindow  = 21 * 24 * time.Hour
	MinVotingWindow      = 7 * 24 * time.Hour
)

// RegimentoLocal são os parâmetros que cada município calibra dentro das faixas
// comuns. DefaultRegimento devolve os defaults sugeridos no protocolo.
type RegimentoLocal struct {
	CouncilSize         int           `json:"councilSize"`         // tamanho do conselho territorial
	ConsecutiveTerms    int           `json:"consecutiveTerms"`    // reconduções consecutivas permitidas
	SupportThresholdPct int           `json:"supportThresholdPct"` // apoio mínimo p/ maturação (% dos vinculados)
	VotingQuorumPct     int           `json:"votingQuorumPct"`     // quórum de validade da votação territorial
	RecallQuorumPct     int           `json:"recallQuorumPct"`     // quórum de recall
	EqualSharePct       int           `json:"equalSharePct"`       // piso igual do envelope (restante é carência)
	StructuringPct      int           `json:"structuringPct"`      // porção estruturante municipal
	InscriptionWindow   time.Duration `json:"inscriptionWindow"`   // janela de inscrição ao conselho
	MaturationWindow    time.Duration `json:"maturationWindow"`    // janela de maturação
	VotingWindow        time.Duration `json:"votingWindow"`        // janela de votação territorial
}

// DefaultRegimento devolve os defaults sugeridos (docs/PROTOCOLO-OP.md §1.2).
// São ponto de partida: o município pode ajustar dentro das faixas.
func DefaultRegimento() RegimentoLocal {
	return RegimentoLocal{
		CouncilSize:         5,
		ConsecutiveTerms:    1,
		SupportThresholdPct: 3,
		VotingQuorumPct:     10,
		RecallQuorumPct:     25,
		EqualSharePct:       50,
		StructuringPct:      20,
		InscriptionWindow:   15 * 24 * time.Hour,
		MaturationWindow:    30 * 24 * time.Hour,
		VotingWindow:        10 * 24 * time.Hour,
	}
}

// CarenciaSharePct é a fração do envelope territorial distribuída por carência —
// o complemento do piso igual.
func (r RegimentoLocal) CarenciaSharePct() int {
	return 100 - r.EqualSharePct
}

// Validate rejeita qualquer parâmetro fora da faixa comum. É a "lei das leis" do
// regimento local: o município escolhe o número, não escolhe se a regra existe.
// Retorna o primeiro desvio encontrado.
func (r RegimentoLocal) Validate() error {
	if err := inRange("councilSize", r.CouncilSize, MinCouncilSize, MaxCouncilSize); err != nil {
		return err
	}
	if err := inRange("consecutiveTerms", r.ConsecutiveTerms, MinConsecutiveTerms, MaxConsecutiveTerms); err != nil {
		return err
	}
	if err := inRange("supportThresholdPct", r.SupportThresholdPct, MinSupportThresholdPct, MaxSupportThresholdPct); err != nil {
		return err
	}
	if err := inRange("votingQuorumPct", r.VotingQuorumPct, MinVotingQuorumPct, MaxVotingQuorumPct); err != nil {
		return err
	}
	if err := inRange("recallQuorumPct", r.RecallQuorumPct, MinRecallQuorumPct, MaxRecallQuorumPct); err != nil {
		return err
	}
	if err := inRange("equalSharePct", r.EqualSharePct, MinEqualSharePct, MaxEqualSharePct); err != nil {
		return err
	}
	if err := inRange("structuringPct", r.StructuringPct, MinStructuringPct, MaxStructuringPct); err != nil {
		return err
	}
	if err := minDuration("inscriptionWindow", r.InscriptionWindow, MinInscriptionWindow); err != nil {
		return err
	}
	if err := minDuration("maturationWindow", r.MaturationWindow, MinMaturationWindow); err != nil {
		return err
	}
	if err := minDuration("votingWindow", r.VotingWindow, MinVotingWindow); err != nil {
		return err
	}

	return nil
}

func inRange(name string, v, min, max int) error {
	if v < min || v > max {
		return web.NewError(http.StatusBadRequest,
			name+" fora da faixa comum: deve estar entre "+itoa(min)+" e "+itoa(max))
	}
	return nil
}

func minDuration(name string, v, min time.Duration) error {
	if v < min {
		return web.NewError(http.StatusBadRequest,
			name+" abaixo do piso comum de "+min.String())
	}
	return nil
}

// itoa evita importar strconv só para mensagens de erro de faixa pequena.
func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	neg := n < 0
	if neg {
		n = -n
	}
	var b [20]byte
	i := len(b)
	for n > 0 {
		i--
		b[i] = byte('0' + n%10)
		n /= 10
	}
	if neg {
		i--
		b[i] = '-'
	}
	return string(b[i:])
}
