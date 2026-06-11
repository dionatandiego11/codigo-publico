package publicapi

const (
	issueTypePublicProblem         = "Problema público"
	issueTypeNormativeGap          = "Lacuna normativa"
	issueTypeExecutionFailure      = "Falha de execução"
	issueTypeBudgetInconsistency   = "Inconsistência orçamentária"
	issueTypeImprovementSuggestion = "Sugestão de melhoria"
	issueTypeTransparencyRequest   = "Pedido de transparência"
)

const (
	issueStatusOpen              = "Aberta"
	issueStatusTriage            = "Em triagem"
	issueStatusDebate            = "Em debate"
	issueStatusLinkedPR          = "Vinculada a PR"
	issueStatusTechnicalAnalysis = "Em análise técnica"
	issueStatusResolved          = "Resolvida"
	issueStatusArchived          = "Arquivada"
)

const (
	prAuthorTypePopularInitiative = "Iniciativa Popular"
	prAuthorTypeTechnical         = "Técnico"
	prAuthorTypeCollectiveMandate = "Mandato Coletivo"
	prAuthorTypeCouncilMember     = "Vereador"
)

const (
	prStatusDraft                    = "Rascunho"           // estado inicial — autor ainda pode revisar antes de publicar
	prStatusOpenForDebate            = "Aberto para debate"
	prStatusPublicReview             = "Em revisão pública"
	prStatusTechnicalReview          = "Em revisão técnica"
	prStatusLegalReview              = "Em revisão jurídica"
	prStatusAwaitingAdjustments      = "Aguardando ajustes"
	prStatusReadyForVoting           = "Pronto para votação"
	prStatusVoting                   = "Em votação"
	prStatusApprovedByPublicConsult  = "Aprovado pela consulta pública"
	prStatusSentToCouncil            = "Encaminhado à Câmara"
	prStatusFormallyApproved         = "Aprovado formalmente"
	prStatusIncorporatedOfficialText = "Incorporado ao texto oficial"
	prStatusRejected                 = "Rejeitado"
	prStatusArchived                 = "Arquivado"
)

const (
	diffLineTypeAdded   = "added"
	diffLineTypeRemoved = "removed"
	diffLineTypeNeutral = "neutral"
)

const (
	voteSelectionApprove = "Aprovo"
	voteSelectionReject  = "Rejeito"
	voteSelectionAbstain = "Abstenção"
)

const (
	votingStatusOpen      = "Aberta"
	votingStatusClosed    = "Encerrada"
	votingStatusCancelled = "Cancelada"
)

var allowedIssueTypes = map[string]struct{}{
	issueTypePublicProblem:         {},
	issueTypeNormativeGap:          {},
	issueTypeExecutionFailure:      {},
	issueTypeBudgetInconsistency:   {},
	issueTypeImprovementSuggestion: {},
	issueTypeTransparencyRequest:   {},
}

var allowedIssueStatuses = map[string]struct{}{
	issueStatusOpen:              {},
	issueStatusTriage:            {},
	issueStatusDebate:            {},
	issueStatusLinkedPR:          {},
	issueStatusTechnicalAnalysis: {},
	issueStatusResolved:          {},
	issueStatusArchived:          {},
}

var allowedPRAuthorTypes = map[string]struct{}{
	prAuthorTypePopularInitiative: {},
	prAuthorTypeTechnical:         {},
	prAuthorTypeCollectiveMandate: {},
	prAuthorTypeCouncilMember:     {},
}

var allowedPRStatuses = map[string]struct{}{
	prStatusDraft:                    {},
	prStatusOpenForDebate:            {},
	prStatusPublicReview:             {},
	prStatusTechnicalReview:          {},
	prStatusLegalReview:              {},
	prStatusAwaitingAdjustments:      {},
	prStatusReadyForVoting:           {},
	prStatusVoting:                   {},
	prStatusApprovedByPublicConsult:  {},
	prStatusSentToCouncil:            {},
	prStatusFormallyApproved:         {},
	prStatusIncorporatedOfficialText: {},
	prStatusRejected:                 {},
	prStatusArchived:                 {},
}

func isAllowedIssueType(issueType string) bool {
	_, ok := allowedIssueTypes[issueType]
	return ok
}

func isAllowedIssueStatus(status string) bool {
	_, ok := allowedIssueStatuses[status]
	return ok
}

func isAllowedPRAuthorType(authorType string) bool {
	_, ok := allowedPRAuthorTypes[authorType]
	return ok
}

func isAllowedPRStatus(status string) bool {
	_, ok := allowedPRStatuses[status]
	return ok
}
