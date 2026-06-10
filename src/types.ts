/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ArticleComment {
  id: string;
  authorName: string;
  authorRole: 'Cidadão' | 'Procurador' | 'Vereador' | 'Técnico' | 'Controladoria';
  content: string;
  createdAt: string;
  likes: number;
}

export interface LawArticle {
  id: string;
  number: number;
  title: string; // Title/Chapter identifier like 'Título I, Capítulo II'
  content: string; // Modo Técnico (Vigente)
  citizenExplanation: string; // Modo Cidadão (Explicação simples)
  chapter: string;
  section?: string;
  version: string;
  lastUpdated: string;
  amendmentNumber?: string;
  comments: ArticleComment[];
}

export type IssueType =
  | 'Problema público'
  | 'Lacuna normativa'
  | 'Falha de execução'
  | 'Inconsistência orçamentária'
  | 'Sugestão de melhoria'
  | 'Pedido de transparência';

export type IssueStatus =
  | 'Aberta'
  | 'Em triagem'
  | 'Em debate'
  | 'Vinculada a PR'
  | 'Em análise técnica'
  | 'Resolvida'
  | 'Arquivada';

export interface Issue {
  id: string; // e.g., '#044' or '#118'
  title: string;
  type: IssueType;
  territory: string;
  theme: string;
  description: string;
  authorName: string;
  createdAt: string;
  status: IssueStatus;
  upvotes: number;
  comments: {
    id: string;
    authorName: string;
    content: string;
    createdAt: string;
  }[];
  linkedPRId?: string;
  assignedDepartment: string;
  relatedArticleId?: string; // Links to law article, if any
  relatedRepository?: string; // e.g., 'Lei Orgânica', 'Plano Diretor'
}

export type PRStatus =
  | 'Rascunho'
  | 'Aberto para debate'
  | 'Em revisão pública'
  | 'Em revisão técnica'
  | 'Em revisão jurídica'
  | 'Aguardando ajustes'
  | 'Pronto para votação'
  | 'Em votação'
  | 'Aprovado pela consulta pública'
  | 'Encaminhado à Câmara'
  | 'Aprovado formalmente'
  | 'Incorporado ao texto oficial'
  | 'Rejeitado'
  | 'Arquivado';

export interface DiffLine {
  type: 'added' | 'removed' | 'neutral';
  content: string;
}

export interface NormativeDiff {
  articleNumber: number;
  titleRef: string;
  beforeText: string;
  afterText: string;
  lines: DiffLine[];
  rationale: string;
}

export interface PRReview {
  id: string;
  reviewerName: string;
  reviewerRole: 'Revisão Popular' | 'Revisão Jurídica' | 'Revisão Técnica' | 'Revisão Orçamentária' | 'Controladoria' | 'Comissão Legislativa';
  status: 'Pendente' | 'Aprovado' | 'Aprovado com ressalvas' | 'Solicita alterações' | 'Rejeitado';
  conclusion: string;
  feedback: string;
  createdAt: string;
}

export interface InstitutionalCheck {
  id: string;
  name: string;
  description: string;
  status: 'Aprovado' | 'Atenção' | 'Reprovado' | 'Pendente';
  feedback: string;
}

export interface CivicPR {
  id: string; // e.g., '#045'
  title: string;
  repository: string; // e.g., 'Lei Orgânica', 'Plano Diretor'
  targetTitle: string; // e.g., 'Título X - Participação Popular'
  affectedArticles: string; // e.g., 'Artigo 12, Parágrafos 1º e 2º'
  authorName: string;
  authorType: 'Iniciativa Popular' | 'Técnico' | 'Mandato Coletivo' | 'Vereador';
  status: PRStatus;
  citizenSummary: string; // Modo Cidadão explanation of proposed changes
  justification: string; // Why this change is requested
  diffs: NormativeDiff[];
  linkedIssueIds: string[];
  upvotes: number;
  comments: {
    id: string;
    authorName: string;
    content: string;
    createdAt: string;
  }[];
  reviews: PRReview[];
  checks: InstitutionalCheck[];
  votingId?: string; // Reference to Votação
  createdAt: string;
  mergeTimeline: {
    title: string;
    date: string;
    completed: boolean;
    description: string;
  }[];
}

export interface Voting {
  id: string; // e.g., 'vote-045'
  title: string;
  citizenSummary: string;
  textChanges: string;
  intendedImpact: string;
  pros: string[];
  cons: string[];
  reviewsOverview: string;
  deadline: string;
  quorumNeeded: number;
  quorumReached: number;
  votesYes: number;
  votesNo: number;
  votesAbstain: number;
  hasVoted?: boolean;
  userVoteSelection?: 'Aprovo' | 'Rejeito' | 'Abstenção';
  voteReceipt?: string;
}

export interface Release {
  id: string; // e.g., 'v2027.1'
  title: string;
  date: string;
  repositoryName: string;
  changelog: string[];
  incorporatedPRIds: string[];
  affectedArticlesCount: number;
  officialDocumentUrl: string;
  promulgatedBy: string;
}

export type ExecutionStatus =
  | 'Aguardando regulamentação'
  | 'Em regulamentação'
  | 'Em execução'
  | 'Parcialmente cumprida'
  | 'Cumprida'
  | 'Descumprida'
  | 'Suspensa judicialmente';

export interface ExecutionTracker {
  id: string;
  title: string;
  originalPRId: string;
  normReference: string; // e.g., 'Artigo 12, §1º da Lei Orgânica'
  responsibleDepartment: string;
  deadline: string;
  status: ExecutionStatus;
  progressPercentage: number;
  budgetAllocated: string;
  budgetSpent: string;
  evidence: {
    title: string;
    date: string;
    url: string;
  }[];
  updates: {
    id: string;
    date: string;
    title: string;
    description: string;
    category: 'Ofício' | 'Licitação' | 'Diário Oficial' | 'Fiscalização Social';
  }[];
}

export interface Territory {
  id: string; // e.g., 'campo-grande'
  name: string;
  zone: 'Zona Rural' | 'Zona Urbana' | 'Zona Especial';
  activeIssuesCount: number;
  linkedPRsCount: number;
  activeVotingsCount: number;
  executionProjectsCount: number;
  activeCitizensCount: number;
}
