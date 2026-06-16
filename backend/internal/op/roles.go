package op

import "strings"

// roles.go centraliza a leitura de papéis institucionais do OP, antes duplicada
// (como isAdminRole/auditActorType) em demands, proposals e votings.

// IsInstitutionalRole indica papéis que agem institucionalmente nos filtros do
// OP: administração do sistema e a instância geral/legislativa. Distinto de
// isSysadminRole (só o bootstrap) — aqui entram também vereador e mesa diretora.
func IsInstitutionalRole(role string) bool {
	switch strings.ToLower(strings.TrimSpace(role)) {
	case "sysadmin", "admin", "institutional_admin", "legislative_admin", "vereador", "mesa_diretora":
		return true
	default:
		return false
	}
}

// AuditActorType mapeia o papel para o tipo de ator da trilha de auditoria.
func AuditActorType(role string) string {
	if IsInstitutionalRole(role) {
		return "institutional"
	}
	return "citizen"
}
