/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Contrato de domínio consumido pelo front-end e espelhado no backend.
 *
 * Datas civis usam ISO date (`YYYY-MM-DD`).
 * Timestamps usam RFC3339/ISO datetime (`2026-06-11T12:00:00Z`).
 * IDs públicos de issue/PR preservam o prefixo `#` nas respostas JSON.
 */

export const ISSUE_TYPES = [
  'Problema público',
  'Lacuna normativa',
  'Falha de execução',
  'Inconsistência orçamentária',
  'Sugestão de melhoria',
  'Pedido de transparência'
] as const;

export type IssueType = (typeof ISSUE_TYPES)[number];

export const ISSUE_STATUSES = [
  'Aberta',
  'Em triagem',
  'Em debate',
  'Vinculada a PR',
  'Em análise técnica',
  'Resolvida',
  'Arquivada'
] as const;

export type IssueStatus = (typeof ISSUE_STATUSES)[number];

export const CIVIC_PR_AUTHOR_TYPES = [
  'Iniciativa Popular',
  'Técnico',
  'Mandato Coletivo',
  'Vereador'
] as const;

export type CivicPRAuthorType = (typeof CIVIC_PR_AUTHOR_TYPES)[number];

export const PR_STATUSES = [
  'Rascunho',
  'Aberto para debate',
  'Em revisão pública',
  'Em revisão técnica',
  'Em revisão jurídica',
  'Aguardando ajustes',
  'Pronto para votação',
  'Em votação',
  'Aprovado pela consulta pública',
  'Encaminhado à Câmara',
  'Aprovado formalmente',
  'Incorporado ao texto oficial',
  'Rejeitado',
  'Arquivado'
] as const;

export type PRStatus = (typeof PR_STATUSES)[number];

export const PR_MERGEABLE_STATUSES = ['Aprovado formalmente'] as const;

export const DIFF_LINE_TYPES = ['added', 'removed', 'neutral'] as const;

export type DiffLineType = (typeof DIFF_LINE_TYPES)[number];

export const ARTICLE_COMMENT_AUTHOR_ROLES = [
  'Cidadão',
  'Procurador',
  'Vereador',
  'Técnico',
  'Controladoria'
] as const;

export type ArticleCommentAuthorRole = (typeof ARTICLE_COMMENT_AUTHOR_ROLES)[number];

export const PR_REVIEW_ROLES = [
  'Revisão Popular',
  'Revisão Jurídica',
  'Revisão Técnica',
  'Revisão Orçamentária',
  'Controladoria',
  'Comissão Legislativa'
] as const;

export type PRReviewRole = (typeof PR_REVIEW_ROLES)[number];

export const PR_REVIEW_STATUSES = [
  'Pendente',
  'Aprovado',
  'Aprovado com ressalvas',
  'Solicita alterações',
  'Rejeitado'
] as const;

export type PRReviewStatus = (typeof PR_REVIEW_STATUSES)[number];

export const INSTITUTIONAL_CHECK_STATUSES = [
  'Aprovado',
  'Atenção',
  'Reprovado',
  'Pendente'
] as const;

export type InstitutionalCheckStatus = (typeof INSTITUTIONAL_CHECK_STATUSES)[number];

export const VOTE_SELECTIONS = ['Aprovo', 'Rejeito', 'Abstenção'] as const;

export type VoteSelectionValue = (typeof VOTE_SELECTIONS)[number];

export const VOTING_STATUSES = ['Aberta', 'Encerrada', 'Cancelada'] as const;

export type VotingStatus = (typeof VOTING_STATUSES)[number];

export const EXECUTION_STATUSES = [
  'Aguardando regulamentação',
  'Em regulamentação',
  'Em execução',
  'Parcialmente cumprida',
  'Cumprida',
  'Descumprida',
  'Suspensa judicialmente'
] as const;

export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number];

export const EXECUTION_UPDATE_CATEGORIES = [
  'Ofício',
  'Licitação',
  'Diário Oficial',
  'Fiscalização Social'
] as const;

export type ExecutionUpdateCategory = (typeof EXECUTION_UPDATE_CATEGORIES)[number];

export const TERRITORY_ZONES = ['Zona Rural', 'Zona Urbana', 'Zona Especial'] as const;

export type TerritoryZone = (typeof TERRITORY_ZONES)[number];
