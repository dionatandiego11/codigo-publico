package publicapi

import (
	"errors"
	"fmt"
)

// ---------------------------------------------------------------------------
// Tipos de metadados
// ---------------------------------------------------------------------------

// PRStatusMeta descreve um estado válido da máquina de estados do PR cívico.
type PRStatusMeta struct {
	// Status é o valor persistido no banco de dados.
	Status string `json:"status"`
	// WorkflowStage agrupa os estados em etapas de alto nível para o frontend.
	// Valores: "rascunho", "revisao", "votacao", "consolidacao", "encerrado"
	WorkflowStage string `json:"workflowStage"`
	// Terminal indica que nenhuma transição de avanço é possível a partir deste estado.
	Terminal bool `json:"terminal"`
	// AcceptsVotes indica se o PR está numa fase em que votações abertas fazem sentido.
	AcceptsVotes bool `json:"acceptsVotes"`
}

// PRTransition descreve uma transição válida entre dois estados.
type PRTransition struct {
	// Key é o identificador único da transição (ex: "debate_aberto").
	Key string `json:"key"`
	// FromStatus é o estado de origem. Vazio significa "criação inicial".
	FromStatus string `json:"fromStatus"`
	// ToStatus é o estado de destino.
	ToStatus string `json:"toStatus"`
	// Trigger é o nome semântico do gatilho institucional.
	Trigger string `json:"trigger"`
	// AllowedRoles lista os roles que podem disparar esta transição.
	// Valores especiais: "citizen_author" (apenas o autor do PR), "system" (automático).
	AllowedRoles []string `json:"allowedRoles"`
	// Description descreve a transição em linguagem institucional.
	Description string `json:"description"`
}

// ---------------------------------------------------------------------------
// Tabela de estados
// ---------------------------------------------------------------------------

var prStatuses = []PRStatusMeta{
	{
		Status:        prStatusDraft,
		WorkflowStage: "rascunho",
		Terminal:      false,
		AcceptsVotes:  false,
	},
	{
		Status:        prStatusOpenForDebate,
		WorkflowStage: "debate",
		Terminal:      false,
		AcceptsVotes:  false,
	},
	{
		Status:        prStatusPublicReview,
		WorkflowStage: "revisao",
		Terminal:      false,
		AcceptsVotes:  false,
	},
	{
		Status:        prStatusTechnicalReview,
		WorkflowStage: "revisao",
		Terminal:      false,
		AcceptsVotes:  false,
	},
	{
		Status:        prStatusLegalReview,
		WorkflowStage: "revisao",
		Terminal:      false,
		AcceptsVotes:  false,
	},
	{
		Status:        prStatusAwaitingAdjustments,
		WorkflowStage: "revisao",
		Terminal:      false,
		AcceptsVotes:  false,
	},
	{
		Status:        prStatusReadyForVoting,
		WorkflowStage: "pre_votacao",
		Terminal:      false,
		AcceptsVotes:  false,
	},
	{
		Status:        prStatusVoting,
		WorkflowStage: "votacao",
		Terminal:      false,
		AcceptsVotes:  true,
	},
	{
		Status:        prStatusApprovedByPublicConsult,
		WorkflowStage: "consolidacao",
		Terminal:      false,
		AcceptsVotes:  false,
	},
	{
		Status:        prStatusSentToCouncil,
		WorkflowStage: "consolidacao",
		Terminal:      false,
		AcceptsVotes:  false,
	},
	{
		Status:        prStatusFormallyApproved,
		WorkflowStage: "consolidacao",
		Terminal:      false,
		AcceptsVotes:  false,
	},
	{
		Status:        prStatusIncorporatedOfficialText,
		WorkflowStage: "encerrado",
		Terminal:      true,
		AcceptsVotes:  false,
	},
	{
		Status:        prStatusRejected,
		WorkflowStage: "encerrado",
		Terminal:      true,
		AcceptsVotes:  false,
	},
	{
		Status:        prStatusArchived,
		WorkflowStage: "encerrado",
		Terminal:      true,
		AcceptsVotes:  false,
	},
}

// ---------------------------------------------------------------------------
// Tabela de transições
// ---------------------------------------------------------------------------

// roleInstitutional abrange todos os papéis institucionais definidos em isInstitutionalRole.
var roleInstitutional = []string{"admin", "institutional_admin", "legislative_admin", "procurador", "secretario", "vereador", "mesa_diretora"}

var prTransitions = []PRTransition{
	// ── Criação ─────────────────────────────────────────────────────────────
	{
		Key:          "criacao",
		FromStatus:   "",
		ToStatus:     prStatusDraft,
		Trigger:      "criacao",
		AllowedRoles: append([]string{"citizen", "citizen_author"}, roleInstitutional...),
		Description:  "O PR cívico nasce em Rascunho, permitindo ao autor revisar antes de abrir para debate.",
	},

	// ── Rascunho → Aberto para debate ───────────────────────────────────────
	{
		Key:          "debate_aberto",
		FromStatus:   prStatusDraft,
		ToStatus:     prStatusOpenForDebate,
		Trigger:      "debate_aberto",
		AllowedRoles: append([]string{"citizen_author"}, roleInstitutional...),
		Description:  "O autor publica o PR, abrindo-o para comentários e debate público.",
	},

	// ── Aberto para debate → revisão ────────────────────────────────────────
	{
		Key:          "encaminhar_revisao_publica",
		FromStatus:   prStatusOpenForDebate,
		ToStatus:     prStatusPublicReview,
		Trigger:      "encaminhar_revisao_publica",
		AllowedRoles: roleInstitutional,
		Description:  "O PR é encaminhado para revisão pública formal por agente institucional.",
	},
	{
		Key:          "encaminhar_revisao_tecnica",
		FromStatus:   prStatusOpenForDebate,
		ToStatus:     prStatusTechnicalReview,
		Trigger:      "encaminhar_revisao_tecnica",
		AllowedRoles: roleInstitutional,
		Description:  "O PR é encaminhado para análise técnica especializada.",
	},

	// ── Revisão pública → ────────────────────────────────────────────────────
	{
		Key:          "exigir_ajustes_revisao_publica",
		FromStatus:   prStatusPublicReview,
		ToStatus:     prStatusAwaitingAdjustments,
		Trigger:      "exigir_ajustes",
		AllowedRoles: roleInstitutional,
		Description:  "A revisão pública aponta inconsistências que exigem ajustes do autor.",
	},
	{
		Key:          "liberar_votacao_revisao_publica",
		FromStatus:   prStatusPublicReview,
		ToStatus:     prStatusReadyForVoting,
		Trigger:      "liberar_votacao",
		AllowedRoles: roleInstitutional,
		Description:  "A revisão pública conclui com parecer favorável, liberando para votação.",
	},

	// ── Revisão técnica → jurídica ──────────────────────────────────────────
	{
		Key:          "encaminhar_juridico",
		FromStatus:   prStatusTechnicalReview,
		ToStatus:     prStatusLegalReview,
		Trigger:      "encaminhar_juridico",
		AllowedRoles: roleInstitutional,
		Description:  "A análise técnica está concluída; o PR segue para revisão jurídica.",
	},
	{
		Key:          "exigir_ajustes_revisao_tecnica",
		FromStatus:   prStatusTechnicalReview,
		ToStatus:     prStatusAwaitingAdjustments,
		Trigger:      "exigir_ajustes",
		AllowedRoles: roleInstitutional,
		Description:  "A revisão técnica aponta ajustes necessários antes de avançar.",
	},

	// ── Revisão jurídica → ──────────────────────────────────────────────────
	{
		Key:          "exigir_ajustes_revisao_juridica",
		FromStatus:   prStatusLegalReview,
		ToStatus:     prStatusAwaitingAdjustments,
		Trigger:      "exigir_ajustes",
		AllowedRoles: roleInstitutional,
		Description:  "A revisão jurídica exige correções no texto antes da votação.",
	},
	{
		Key:          "liberar_votacao_revisao_juridica",
		FromStatus:   prStatusLegalReview,
		ToStatus:     prStatusReadyForVoting,
		Trigger:      "liberar_votacao",
		AllowedRoles: roleInstitutional,
		Description:  "A revisão jurídica conclui com parecer favorável, liberando para votação.",
	},

	// ── Aguardando ajustes → debate ─────────────────────────────────────────
	{
		Key:          "ajustes_concluidos",
		FromStatus:   prStatusAwaitingAdjustments,
		ToStatus:     prStatusOpenForDebate,
		Trigger:      "ajustes_concluidos",
		AllowedRoles: append([]string{"citizen_author"}, roleInstitutional...),
		Description:  "O autor conclui os ajustes solicitados e reabre o PR para debate.",
	},

	// ── Pronto para votação → Em votação ────────────────────────────────────
	{
		Key:          "votacao_aberta",
		FromStatus:   prStatusReadyForVoting,
		ToStatus:     prStatusVoting,
		Trigger:      "votacao_aberta",
		AllowedRoles: roleInstitutional,
		Description:  "A votação é aberta formalmente; o PR passa a aceitar votos dos cidadãos.",
	},

	// ── Em votação → resultado (disparado pelo sistema ao encerrar votação) ──
	{
		Key:          "quorum_e_maioria_favoravel",
		FromStatus:   prStatusVoting,
		ToStatus:     prStatusApprovedByPublicConsult,
		Trigger:      "quorum_e_maioria_favoravel",
		AllowedRoles: []string{"system"},
		Description:  "A votação atingiu quórum com maioria favorável; PR aprovado pela consulta pública.",
	},
	{
		Key:          "rejeicao_por_votacao",
		FromStatus:   prStatusVoting,
		ToStatus:     prStatusRejected,
		Trigger:      "votacao_encerrada_sem_aprovacao",
		AllowedRoles: []string{"system"},
		Description:  "A votação encerrou sem aprovação (quórum insuficiente, maioria contrária ou empate).",
	},

	// ── Aprovado pela consulta → Câmara ─────────────────────────────────────
	{
		Key:          "encaminhar_camara",
		FromStatus:   prStatusApprovedByPublicConsult,
		ToStatus:     prStatusSentToCouncil,
		Trigger:      "encaminhar_camara",
		AllowedRoles: roleInstitutional,
		Description:  "O PR aprovado na consulta é formalmente encaminhado à Câmara Municipal.",
	},

	// ── Câmara → Aprovação formal ────────────────────────────────────────────
	{
		Key:          "aprovacao_formal",
		FromStatus:   prStatusSentToCouncil,
		ToStatus:     prStatusFormallyApproved,
		Trigger:      "aprovacao_formal",
		AllowedRoles: roleInstitutional,
		Description:  "A Câmara aprova formalmente o PR; pronto para merge institucional.",
	},

	// ── Aprovado formalmente → Merge ─────────────────────────────────────────
	// (este passo é executado pelo endpoint /prs/{id}/merge e não pela máquina de estados diretamente)

	// ── Rejeição procedimental (qualquer estado não-terminal) ────────────────
	{
		Key:          "rejeicao_procedimental_rascunho",
		FromStatus:   prStatusDraft,
		ToStatus:     prStatusRejected,
		Trigger:      "rejeicao_procedimental",
		AllowedRoles: roleInstitutional,
		Description:  "Rejeição procedimental por decisão institucional.",
	},
	{
		Key:          "rejeicao_procedimental_debate",
		FromStatus:   prStatusOpenForDebate,
		ToStatus:     prStatusRejected,
		Trigger:      "rejeicao_procedimental",
		AllowedRoles: roleInstitutional,
		Description:  "Rejeição procedimental por decisão institucional.",
	},
	{
		Key:          "rejeicao_procedimental_revisao_publica",
		FromStatus:   prStatusPublicReview,
		ToStatus:     prStatusRejected,
		Trigger:      "rejeicao_procedimental",
		AllowedRoles: roleInstitutional,
		Description:  "Rejeição procedimental por decisão institucional.",
	},
	{
		Key:          "rejeicao_procedimental_revisao_tecnica",
		FromStatus:   prStatusTechnicalReview,
		ToStatus:     prStatusRejected,
		Trigger:      "rejeicao_procedimental",
		AllowedRoles: roleInstitutional,
		Description:  "Rejeição procedimental por decisão institucional.",
	},
	{
		Key:          "rejeicao_procedimental_revisao_juridica",
		FromStatus:   prStatusLegalReview,
		ToStatus:     prStatusRejected,
		Trigger:      "rejeicao_procedimental",
		AllowedRoles: roleInstitutional,
		Description:  "Rejeição procedimental por decisão institucional.",
	},
	{
		Key:          "rejeicao_procedimental_ajustes",
		FromStatus:   prStatusAwaitingAdjustments,
		ToStatus:     prStatusRejected,
		Trigger:      "rejeicao_procedimental",
		AllowedRoles: roleInstitutional,
		Description:  "Rejeição procedimental por decisão institucional.",
	},
	{
		Key:          "rejeicao_procedimental_pre_votacao",
		FromStatus:   prStatusReadyForVoting,
		ToStatus:     prStatusRejected,
		Trigger:      "rejeicao_procedimental",
		AllowedRoles: roleInstitutional,
		Description:  "Rejeição procedimental por decisão institucional.",
	},
	{
		Key:          "rejeicao_procedimental_camara",
		FromStatus:   prStatusSentToCouncil,
		ToStatus:     prStatusRejected,
		Trigger:      "rejeicao_procedimental",
		AllowedRoles: roleInstitutional,
		Description:  "Rejeição procedimental por decisão institucional.",
	},

	// ── Arquivamento (qualquer estado não-terminal) ───────────────────────────
	{
		Key:          "arquivamento_rascunho",
		FromStatus:   prStatusDraft,
		ToStatus:     prStatusArchived,
		Trigger:      "arquivamento",
		AllowedRoles: append([]string{"citizen_author"}, roleInstitutional...),
		Description:  "O PR é arquivado administrativamente.",
	},
	{
		Key:          "arquivamento_debate",
		FromStatus:   prStatusOpenForDebate,
		ToStatus:     prStatusArchived,
		Trigger:      "arquivamento",
		AllowedRoles: roleInstitutional,
		Description:  "O PR é arquivado administrativamente.",
	},
	{
		Key:          "arquivamento_revisao_publica",
		FromStatus:   prStatusPublicReview,
		ToStatus:     prStatusArchived,
		Trigger:      "arquivamento",
		AllowedRoles: roleInstitutional,
		Description:  "O PR é arquivado administrativamente.",
	},
	{
		Key:          "arquivamento_revisao_tecnica",
		FromStatus:   prStatusTechnicalReview,
		ToStatus:     prStatusArchived,
		Trigger:      "arquivamento",
		AllowedRoles: roleInstitutional,
		Description:  "O PR é arquivado administrativamente.",
	},
	{
		Key:          "arquivamento_revisao_juridica",
		FromStatus:   prStatusLegalReview,
		ToStatus:     prStatusArchived,
		Trigger:      "arquivamento",
		AllowedRoles: roleInstitutional,
		Description:  "O PR é arquivado administrativamente.",
	},
	{
		Key:          "arquivamento_ajustes",
		FromStatus:   prStatusAwaitingAdjustments,
		ToStatus:     prStatusArchived,
		Trigger:      "arquivamento",
		AllowedRoles: roleInstitutional,
		Description:  "O PR é arquivado administrativamente.",
	},
	{
		Key:          "arquivamento_consulta_aprovada",
		FromStatus:   prStatusApprovedByPublicConsult,
		ToStatus:     prStatusArchived,
		Trigger:      "arquivamento",
		AllowedRoles: roleInstitutional,
		Description:  "O PR é arquivado administrativamente após aprovação da consulta.",
	},
	{
		Key:          "arquivamento_camara",
		FromStatus:   prStatusSentToCouncil,
		ToStatus:     prStatusArchived,
		Trigger:      "arquivamento",
		AllowedRoles: roleInstitutional,
		Description:  "O PR é arquivado administrativamente.",
	},
}

// ---------------------------------------------------------------------------
// Índices internos (construídos na inicialização do pacote)
// ---------------------------------------------------------------------------

// statusMetaByValue mapeia status → PRStatusMeta para lookup O(1).
var statusMetaByValue map[string]PRStatusMeta

// transitionsByFrom mapeia fromStatus → lista de transições possíveis.
var transitionsByFrom map[string][]PRTransition

func init() {
	statusMetaByValue = make(map[string]PRStatusMeta, len(prStatuses))
	for _, s := range prStatuses {
		statusMetaByValue[s.Status] = s
	}

	transitionsByFrom = make(map[string][]PRTransition)
	for _, t := range prTransitions {
		transitionsByFrom[t.FromStatus] = append(transitionsByFrom[t.FromStatus], t)
	}
}

// ---------------------------------------------------------------------------
// PRStateMachine — API pública
// ---------------------------------------------------------------------------

// PRStateMachine é a máquina de estados de PRs cívicos.
// É segura para uso concorrente (somente leitura após init).
type PRStateMachine struct{}

// NewPRStateMachine retorna uma instância da máquina de estados.
func NewPRStateMachine() *PRStateMachine {
	return &PRStateMachine{}
}

// StatusMeta retorna os metadados de um estado, ou erro se o status for desconhecido.
func (m *PRStateMachine) StatusMeta(status string) (PRStatusMeta, error) {
	meta, ok := statusMetaByValue[status]
	if !ok {
		return PRStatusMeta{}, fmt.Errorf("status de PR desconhecido: %q", status)
	}
	return meta, nil
}

// AllStatuses retorna a lista completa de estados ordenados pelo fluxo.
func (m *PRStateMachine) AllStatuses() []PRStatusMeta {
	return append([]PRStatusMeta{}, prStatuses...)
}

// AllTransitions retorna a lista completa de transições definidas.
func (m *PRStateMachine) AllTransitions() []PRTransition {
	return append([]PRTransition{}, prTransitions...)
}

// AllowedTransitions retorna as transições que o ator (role, isAuthor) pode
// disparar a partir do estado atual do PR.
//
// isAuthor indica se o ator autenticado é o autor original do PR, o que
// desbloqueia transições com role "citizen_author".
func (m *PRStateMachine) AllowedTransitions(fromStatus, actorRole string, isAuthor bool) []PRTransition {
	transitions, ok := transitionsByFrom[fromStatus]
	if !ok {
		return nil
	}

	result := make([]PRTransition, 0, len(transitions))
	for _, t := range transitions {
		if m.roleCanTransition(t.AllowedRoles, actorRole, isAuthor) {
			result = append(result, t)
		}
	}
	return result
}

// Transition valida e retorna a transição entre fromStatus → toStatus para o
// papel do ator. Retorna erro se:
//   - fromStatus é terminal
//   - a transição fromStatus→toStatus não existe
//   - o papel do ator não está autorizado para esta transição
func (m *PRStateMachine) Transition(fromStatus, toStatus, actorRole string, isAuthor bool) (*PRTransition, error) {
	// Validar estado de origem
	fromMeta, ok := statusMetaByValue[fromStatus]
	if !ok {
		return nil, fmt.Errorf("estado de origem inválido: %q", fromStatus)
	}
	if fromMeta.Terminal {
		return nil, fmt.Errorf("o estado %q é terminal; nenhuma transição é permitida", fromStatus)
	}

	// Validar estado de destino
	if _, ok := statusMetaByValue[toStatus]; !ok {
		return nil, fmt.Errorf("estado de destino inválido: %q", toStatus)
	}

	// Buscar transição válida
	transitions := transitionsByFrom[fromStatus]
	for _, t := range transitions {
		if t.ToStatus != toStatus {
			continue
		}
		// Encontrou a transição — verificar autorização
		if !m.roleCanTransition(t.AllowedRoles, actorRole, isAuthor) {
			return nil, fmt.Errorf(
				"papel %q não está autorizado a fazer a transição %q → %q",
				actorRole, fromStatus, toStatus,
			)
		}
		t := t // evitar captura de loop
		return &t, nil
	}

	return nil, fmt.Errorf(
		"transição de %q para %q não é permitida pelo fluxo institucional",
		fromStatus, toStatus,
	)
}

// TransitionByTrigger localiza e valida uma transição pelo gatilho semântico.
// Útil para transições disparadas pelo sistema (ex: encerramento de votação).
func (m *PRStateMachine) TransitionByTrigger(fromStatus, trigger, actorRole string, isAuthor bool) (*PRTransition, error) {
	transitions := transitionsByFrom[fromStatus]
	for _, t := range transitions {
		if t.Trigger != trigger {
			continue
		}
		if !m.roleCanTransition(t.AllowedRoles, actorRole, isAuthor) {
			return nil, fmt.Errorf(
				"papel %q não está autorizado para o gatilho %q a partir de %q",
				actorRole, trigger, fromStatus,
			)
		}
		t := t
		return &t, nil
	}
	return nil, fmt.Errorf(
		"nenhuma transição com gatilho %q encontrada a partir do estado %q",
		trigger, fromStatus,
	)
}

// InitialTransition retorna a transição de criação do PR (FromStatus == "").
func (m *PRStateMachine) InitialTransition() PRTransition {
	for _, t := range prTransitions {
		if t.FromStatus == "" && t.ToStatus == prStatusDraft {
			return t
		}
	}
	// Fallback defensivo — nunca deve ocorrer se a tabela estiver correta.
	return PRTransition{
		Key:     "criacao",
		ToStatus: prStatusDraft,
		Trigger: "criacao",
	}
}

// VotingResolutionTrigger determina o gatilho correto para encerrar uma votação
// com base na contagem de votos e quórum necessário.
//
// Retorna:
//   - "quorum_e_maioria_favoravel" → PR deve ser aprovado pela consulta pública
//   - "votacao_encerrada_sem_aprovacao" → PR deve ser rejeitado
func (m *PRStateMachine) VotingResolutionTrigger(quorumNeeded, quorumReached, votesYes, votesNo int) string {
	if quorumReached < quorumNeeded {
		// Quórum insuficiente
		return "votacao_encerrada_sem_aprovacao"
	}
	if votesYes > votesNo {
		return "quorum_e_maioria_favoravel"
	}
	// Empate ou maioria contrária
	return "votacao_encerrada_sem_aprovacao"
}

// ---------------------------------------------------------------------------
// helpers internos
// ---------------------------------------------------------------------------

// roleCanTransition verifica se actorRole tem permissão para uma transição dado
// a lista de papéis permitidos. isAuthor desbloqueia a role "citizen_author".
func (m *PRStateMachine) roleCanTransition(allowedRoles []string, actorRole string, isAuthor bool) bool {
	for _, allowed := range allowedRoles {
		switch allowed {
		case "system":
			// Transições de sistema nunca são disparadas diretamente por usuários via API.
			// São chamadas programaticamente com actorRole == "system".
			if actorRole == "system" {
				return true
			}
		case "citizen_author":
			// Qualquer cidadão que seja o autor original pode executar.
			if isAuthor {
				return true
			}
		case "citizen":
			// Qualquer cidadão autenticado pode executar (independente de ser autor).
			if actorRole != "" {
				return true
			}
		default:
			// Papéis institucionais específicos.
			if actorRole == allowed {
				return true
			}
		}
	}
	return false
}

// ErrForbiddenTransition é retornado quando o papel do ator não autoriza a transição.
var ErrForbiddenTransition = errors.New("transição não autorizada para este papel")

// ErrInvalidTransition é retornado quando a transição não existe no fluxo.
var ErrInvalidTransition = errors.New("transição inválida no fluxo institucional")
