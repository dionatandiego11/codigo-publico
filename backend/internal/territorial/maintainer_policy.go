package territorial

import (
	"net/http"
	"time"

	"codigo-publico/backend/internal/web"
)

// maintainer_policy.go é a camada de decisão pura do protocolo de maintainers:
// quem pode nomear, qual o mandato, como se ativa, renova, remove e como a
// moção popular (recall) destitui. Sem acesso a banco — testável isoladamente.
//
// Defaults provisórios (constantes, fáceis de mudar — decisões em aberto no
// docs/sugestao_de_governanca.md):
//   - mandato provisório: 90 dias
//   - mandato pleno: 365 dias
//   - quórum de recall: 50% + 1 dos vínculos T3+ ativos do território

const (
	ProvisionalMandate = 90 * 24 * time.Hour
	FullMandate        = 365 * 24 * time.Hour
)

// effectiveMaintainerSQL é a condição de "maintainer com poderes": status
// efetivo e mandato não vencido. Compartilhada pelas queries do repositório.
const effectiveMaintainerSQL = `status IN ('Provisório', 'Ativo', 'Em revisão') AND (term_end IS NULL OR term_end > NOW())`

// IsEffectiveStatus indica os status que conferem poderes ao maintainer.
func IsEffectiveStatus(status string) bool {
	switch status {
	case MaintainerStatusProvisional, MaintainerStatusActive, MaintainerStatusUnderReview:
		return true
	default:
		return false
	}
}

// AppointmentInitialStatus deriva o status inicial da origem da indicação.
// Nomeação do executivo ou emergencial é SEMPRE provisória — nunca nasce com
// mandato pleno, evitando captura por nomeação direta. Eleição territorial e
// indicação legislativa podem nomear diretamente em mandato pleno.
func AppointmentInitialStatus(source string) (string, error) {
	switch source {
	case AppointmentElection, AppointmentLegislative:
		return MaintainerStatusActive, nil
	case AppointmentExecutive, AppointmentEmergency:
		return MaintainerStatusProvisional, nil
	default:
		return "", web.NewError(http.StatusBadRequest, "appointmentSource is invalid")
	}
}

// MandateDuration devolve a duração do mandato conforme o status inicial.
func MandateDuration(status string) time.Duration {
	if status == MaintainerStatusProvisional {
		return ProvisionalMandate
	}
	return FullMandate
}

// CanAppoint: nomear maintainer geral exige sysadmin (o assento institucional
// geral); nomear territorial exige a instância geral (sysadmin ou maintainer
// geral). Bootstrap: o sysadmin nomeia os primeiros maintainers.
func CanAppoint(scope string, auth DecisionAuthority) error {
	switch scope {
	case ScopeGeneral:
		if !auth.IsSysadmin {
			return web.NewError(http.StatusForbidden, "appointing a general maintainer requires a sysadmin")
		}
	case ScopeTerritorial:
		if !auth.IsGeneralInstance() {
			return web.NewError(http.StatusForbidden, "appointing a territorial maintainer requires the general instance")
		}
	default:
		return web.NewError(http.StatusBadRequest, "scope must be territorial or geral")
	}

	return nil
}

// CanActivate: ratificar um provisório em pleno (provisional → active) exige a
// instância geral (representa a eleição territorial ou a ratificação legislativa).
func CanActivate(current string, auth DecisionAuthority) error {
	if current != MaintainerStatusProvisional {
		return web.NewError(http.StatusConflict, "only provisional maintainers can be ratified")
	}
	if !auth.IsGeneralInstance() {
		return web.NewError(http.StatusForbidden, "ratification requires the general instance")
	}

	return nil
}

// CanRenew: renovar mandato exige maintainer efetivo e instância geral, com
// justificativa pública (validada no serviço).
func CanRenew(current string, auth DecisionAuthority) error {
	if !IsEffectiveStatus(current) {
		return web.NewError(http.StatusConflict, "only effective maintainers can have their mandate renewed")
	}
	if !auth.IsGeneralInstance() {
		return web.NewError(http.StatusForbidden, "mandate renewal requires the general instance")
	}

	return nil
}

// CanRemoveForCause: destituição fundamentada pela instância recursal. O
// executivo isolado não destitui — apenas a instância geral (legislativo) ou a
// moção popular. Toda remoção é auditada.
func CanRemoveForCause(current string, auth DecisionAuthority) error {
	if current == MaintainerStatusRemoved || current == MaintainerStatusExpired {
		return web.NewError(http.StatusConflict, "maintainer is already removed or expired")
	}
	if !auth.IsGeneralInstance() {
		return web.NewError(http.StatusForbidden, "removal for cause requires the general instance")
	}

	return nil
}

// CanOpenRecall: moção popular só contra maintainer efetivo.
func CanOpenRecall(maintainerStatus string) error {
	if !IsEffectiveStatus(maintainerStatus) {
		return web.NewError(http.StatusConflict, "only an effective maintainer can be recalled")
	}

	return nil
}

// RecallQuorum: 50% + 1 dos vínculos T3+ ativos do território.
func RecallQuorum(seniorActiveBonds int) int {
	if seniorActiveBonds < 1 {
		// Sem base eleitoral mínima, uma assinatura já decide (território
		// minúsculo); evita quórum zero.
		return 1
	}
	return seniorActiveBonds/2 + 1
}

// RecallReached indica se as assinaturas atingiram o quórum.
func RecallReached(signatures, quorum int) bool {
	return signatures >= quorum
}

// ComputeTermEnd calcula o fim do mandato a partir do início e do status.
func ComputeTermEnd(status string, start time.Time) time.Time {
	return start.Add(MandateDuration(status))
}

// IsSeniorBond indica vínculo "T3+" (validado/qualificado), base do quórum de
// recall e da plena cidadania territorial.
func IsSeniorBond(trustLevel string) bool {
	return trustLevel == "T3" || trustLevel == "T4"
}
