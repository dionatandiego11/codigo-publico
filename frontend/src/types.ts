/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  ArticleCommentAuthorRole,
  CivicPRAuthorType,
  DiffLineType,
  ExecutionStatus,
  ExecutionUpdateCategory,
  InstitutionalCheckStatus,
  IssueStatus,
  IssueType,
  PRReviewRole,
  PRReviewStatus,
  PRStatus,
  TerritoryZone,
  VoteSelectionValue,
  VotingStatus
} from './contracts/civic';

export type {
  ArticleCommentAuthorRole,
  CivicPRAuthorType,
  DiffLineType,
  ExecutionStatus,
  ExecutionUpdateCategory,
  InstitutionalCheckStatus,
  IssueStatus,
  IssueType,
  PRReviewRole,
  PRReviewStatus,
  PRStatus,
  TerritoryZone,
  VoteSelectionValue,
  VotingStatus
} from './contracts/civic';

export interface Citizen {
  id: string;
  fullName: string;
  birthDate: string;
  phone?: string;
  email?: string;
  territoryId?: string;
  territoryName?: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface CitizenDashboardData {
  name: string;
  email: string;
  territoryId: string;
  territoryName?: string;
  registeredAt: string;
  citizenId: string;
  createdIssues: { id: string; title: string; status: string }[];
  createdPRs?: { id: string; title: string; status: string }[];
  votedList: { id: string; selection: string; receipt: string; txHash: string }[];
  supportedPRs: string[];
}

export interface ArticleComment {
  id: string;
  authorName: string;
  authorRole: ArticleCommentAuthorRole;
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
  assignedDepartment?: string;
  relatedArticleId?: string; // Links to law article, if any
  relatedRepository?: string; // e.g., 'Lei Orgânica', 'Plano Diretor'
}

export interface DiffLine {
  type: DiffLineType;
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
  reviewerRole: PRReviewRole;
  status: PRReviewStatus;
  conclusion: string;
  feedback: string;
  createdAt: string;
}

export interface InstitutionalCheck {
  id: string;
  name: string;
  description: string;
  status: InstitutionalCheckStatus;
  feedback: string;
}

export interface CivicPR {
  id: string; // e.g., '#045'
  title: string;
  repository: string; // e.g., 'Lei Orgânica', 'Plano Diretor'
  targetTitle: string; // e.g., 'Título X - Participação Popular'
  affectedArticles: string; // e.g., 'Artigo 12, Parágrafos 1º e 2º'
  authorName: string;
  authorType: CivicPRAuthorType;
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
  forkedFromId?: string; // ID do PR original, se este for um fork
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
  status: VotingStatus;
  hasVoted?: boolean;
  userVoteSelection?: VoteSelectionValue;
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
  officialDocumentUrl?: string;
  promulgatedBy: string;
}

export interface ExecutionTracker {
  id: string;
  title: string;
  originalPRId?: string;
  normReference: string; // e.g., 'Artigo 12, §1º da Lei Orgânica'
  responsibleDepartment: string;
  deadline?: string;
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
    category: ExecutionUpdateCategory;
  }[];
}

export interface Territory {
  id: string; // e.g., 'campo-grande'
  name: string;
  zone: TerritoryZone;
  activeIssuesCount: number;
  linkedPRsCount: number;
  activeVotingsCount: number;
  executionProjectsCount: number;
  activeCitizensCount: number;
}

export type OPCyclePhase =
  | 'Rascunho'
  | 'Inscrições'
  | 'Coleta'
  | 'Votação'
  | 'Consolidação'
  | 'Institucionalização'
  | 'Encerrado'
  | 'Cancelado';

export interface OPRegimento {
  councilSize: number;
  consecutiveTerms: number;
  supportThresholdPct: number;
  votingQuorumPct: number;
  recallQuorumPct: number;
  equalSharePct: number;
  structuringPct: number;
  inscriptionWindow: number;
  maturationWindow: number;
  votingWindow: number;
}

export interface OPCalendar {
  inscriptionStart: string;
  sortitionAt: string;
  collectionStart: string;
  votingStart: string;
  votingEnd: string;
}

export interface OPCycle {
  id: string;
  label: string;
  phase: OPCyclePhase;
  regimento: OPRegimento;
  envelopeTotal: number;
  startsAt?: string | null;
  loaDeadline?: string | null;
  calendar?: OPCalendar;
  createdAt: string;
  updatedAt: string;
}

export type BudgetDemandStatus =
  | 'Recebida'
  | 'Engajamento inicial'
  | 'Precisa de informações'
  | 'Agrupada'
  | 'Maturação territorial'
  | 'Validada territorialmente'
  | 'Apta para priorização'
  | 'Incluída na matriz orçamentária'
  | 'Em execução'
  | 'Concluída'
  | 'Dormente'
  | 'Arquivada';

export interface BudgetDemandComment {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export type BudgetDemandLinkType = 'grouped_into' | 'grouped_from' | 'fork' | 'forked_from';

export interface BudgetDemandLink {
  type: BudgetDemandLinkType;
  demandId: string;
  demandTitle: string;
  demandStatus: BudgetDemandStatus;
  reason: string;
  createdAt: string;
}

export interface BudgetDemand {
  id: string;
  cycleId: string;
  territoryId: string;
  territoryName: string;
  title: string;
  description: string;
  location: string;
  category: string;
  authorName: string;
  status: BudgetDemandStatus;
  supports: number;
  supportThreshold: number;
  supportProgressPercent: number;
  supportReached: boolean;
  groupedIntoDemandId?: string;
  forkedFromDemandId?: string;
  links: BudgetDemandLink[];
  comments: BudgetDemandComment[];
  createdAt: string;
  updatedAt: string;
}

export type BudgetProposalStatus =
  | 'Em elaboração'
  | 'Apta para votação'
  | 'Em votação'
  | 'Priorizada'
  | 'Incluída na matriz'
  | 'Retornada para maturação'
  | 'Arquivada';

export interface BudgetProposal {
  id: string;
  cycleId: string;
  demandId: string;
  territoryId: string;
  territoryName: string;
  title: string;
  problemSummary: string;
  solutionScope: string;
  estimatedCostCents: number;
  category: string;
  authorName: string;
  status: BudgetProposalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OPVoting {
  id: string;
  cycleId: string;
  proposalId: string;
  territoryId: string;
  territoryName: string;
  title: string;
  summary: string;
  deadline: string;
  quorumNeeded: number;
  quorumReached: number;
  votesYes: number;
  votesNo: number;
  votesAbstain: number;
  status: VotingStatus;
  hasVoted?: boolean;
  userVoteSelection?: VoteSelectionValue;
  voteReceipt?: string;
  createdAt: string;
  updatedAt: string;
}
