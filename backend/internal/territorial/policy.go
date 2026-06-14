package territorial

import (
	"net/http"
	"time"

	"codigo-publico/backend/internal/web"
)

// policy.go é a camada de decisão pura da governança territorial — a
// "constituição operacional". Não acessa banco nem rede: o repositório fornece
// os fatos (status do vínculo, papéis do ator, datas) e estas funções decidem
// o resultado. Por serem puras, são testáveis sem PostgreSQL.

// RecontestationCooldown: um vínculo confirmado após contestação ("Mantido")
// não pode ser recontestado por 180 dias, salvo apresentação de fato novo.
// Reduz perseguição local por recontestação repetida.
const RecontestationCooldown = 180 * 24 * time.Hour

// DecisionAuthority reúne os fatos de autorização do ator, resolvidos pelo
// repositório, para que a decisão de poder seja tomada sem novo acesso ao banco.
type DecisionAuthority struct {
	IsSysadmin                  bool
	IsGeneralMaintainer         bool
	IsTerritorialMaintainerHere bool
}

// CanDecideForTerritory: decide vínculos e contestações em primeira instância —
// maintainer territorial do território, maintainer geral ou sysadmin.
func (a DecisionAuthority) CanDecideForTerritory() bool {
	return a.IsSysadmin || a.IsGeneralMaintainer || a.IsTerritorialMaintainerHere
}

// IsGeneralInstance: instância recursal — maintainer geral ou sysadmin.
func (a DecisionAuthority) IsGeneralInstance() bool {
	return a.IsSysadmin || a.IsGeneralMaintainer
}

// ResolveApprovalTrustLevel valida o nível de confiança de uma aprovação e
// devolve o nível efetivo. Vazio assume o default do tipo de vínculo; o teto
// por tipo é respeitado (morador até T4; trabalhador/estudante até T2).
func ResolveApprovalTrustLevel(bondType, requested string) (string, error) {
	level := requested
	if level == "" {
		level = defaultTrustLevel(bondType)
	}
	if !isValidTrustLevel(level) {
		return "", web.NewError(http.StatusBadRequest, "trustLevel must be T0..T4")
	}
	if trustLevelExceeds(level, maxTrustLevel(bondType)) {
		return "", web.NewError(http.StatusBadRequest, "trustLevel exceeds the maximum for this bond type")
	}

	return level, nil
}

// CanApproveOrReject verifica se um vínculo no estado atual admite decisão de
// primeira instância (aprovação/recusa) e se a recusa traz justificativa.
func CanApproveOrReject(bondStatus string, approve bool, reason string) error {
	if bondStatus != BondStatusPending {
		return web.NewError(http.StatusConflict, "only pending bonds can be approved or rejected")
	}
	if !approve && reason == "" {
		return web.NewError(http.StatusBadRequest, "rejecting a bond requires a reason")
	}

	return nil
}

// CanAppeal: apenas o dono do vínculo recorre, e só de uma recusa.
func CanAppeal(bondStatus string, isOwner bool) error {
	if !isOwner {
		return web.NewError(http.StatusForbidden, "only the bond owner can appeal")
	}
	if bondStatus != BondStatusRejected {
		return web.NewError(http.StatusConflict, "only rejected bonds can be appealed")
	}

	return nil
}

// ContestEligibility reúne os fatos para decidir uma contestação comunitária.
type ContestEligibility struct {
	BondStatus            string
	IsOwnBond             bool
	ContestantBondStatus  string
	ContestantTerritoryID string
	BondTerritoryID       string
}

// CanContest aplica o ABAC da contestação: só vínculo aprovado é contestável,
// ninguém contesta o próprio vínculo, e quem contesta precisa ter vínculo
// aprovado no mesmo território.
func CanContest(e ContestEligibility) error {
	if e.BondStatus != BondStatusApproved {
		return web.NewError(http.StatusConflict, "only approved bonds can be contested")
	}
	if e.IsOwnBond {
		return web.NewError(http.StatusBadRequest, "you cannot contest your own bond")
	}
	if e.ContestantBondStatus != BondStatusApproved || e.ContestantTerritoryID != e.BondTerritoryID {
		return web.NewError(http.StatusForbidden, "contesting requires an approved bond in the same territory")
	}

	return nil
}

// CanReopenContestation aplica o período de descanso: depois de um vínculo ser
// "Mantido", nova contestação só é aceita após 180 dias ou com fato novo.
func CanReopenContestation(lastUpheldAt time.Time, hasLastUpheld bool, now time.Time, hasNewFact bool) error {
	if !hasLastUpheld || hasNewFact {
		return nil
	}
	if now.Sub(lastUpheldAt) < RecontestationCooldown {
		until := lastUpheldAt.Add(RecontestationCooldown).Format("2006-01-02")
		return web.NewError(http.StatusConflict,
			"bond is in a rest period after being upheld; recontestation allowed after "+until+" or with a new fact")
	}

	return nil
}

// ValidateContestationOutcome restringe o desfecho conforme a instância:
// primeira instância pode Manter, Revogar ou Escalar; a instância recursal
// (escalada) só Mantém ou Revoga.
func ValidateContestationOutcome(stage, outcome string) error {
	switch stage {
	case ContestationStatusOpen:
		if outcome != ContestationStatusUpheld && outcome != ContestationStatusRevoked && outcome != ContestationStatusEscalated {
			return web.NewError(http.StatusBadRequest, "outcome must be Mantido, Revogado or Escalada")
		}
	case ContestationStatusEscalated:
		if outcome != ContestationStatusUpheld && outcome != ContestationStatusRevoked {
			return web.NewError(http.StatusBadRequest, "outcome must be Mantido or Revogado")
		}
	default:
		return web.NewError(http.StatusConflict, "contestation has already been decided")
	}

	return nil
}
