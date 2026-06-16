/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MOCK_REPOSITORIOS } from './mock-data';

import {
  Citizen,
  CitizenDashboardData,
  BudgetDemand,
  BudgetDemandComment,
  BudgetProposal,
  CivicPR,
  ExecutionTracker,
  InstitutionalCheck,
  Issue,
  IssueStatus,
  LawArticle,
  NormativeDiff,
  OPVoting,
  OPCycle,
  PRStatus,
  PRReview,
  Release,
  Territory,
  VoteSelectionValue,
  Voting
} from '../types';
import { postJSON, requestJSON, requestOptionalJSON, routeId } from '../api/client';

export interface PublicStats {
  totalCitizens: number;
  organicLawArticles: number;
  openIssuesCount: number;
  prsInReviewCount: number;
  activeVotingsCount: number;
  releasesCount: number;
  civicParticipationRate: string;
}

// Public read endpoints backed by PostgreSQL.
export async function getTerritories(): Promise<Territory[]> {
  return requestJSON<Territory[]>('/territories');
}

export async function getOrganicLawArticles(): Promise<LawArticle[]> {
  return requestJSON<LawArticle[]>('/organic-law/articles');
}

export async function getOrganicLawArticle(id: string): Promise<LawArticle | undefined> {
  return requestOptionalJSON<LawArticle>(`/organic-law/articles/${routeId(id)}`);
}

export async function getIssues(): Promise<Issue[]> {
  return requestJSON<Issue[]>('/issues');
}

export async function getIssueById(id: string): Promise<Issue | undefined> {
  return requestOptionalJSON<Issue>(`/issues/${routeId(id)}`);
}

export async function getCivicPRs(): Promise<CivicPR[]> {
  return requestJSON<CivicPR[]>('/prs');
}

export async function getCivicPRById(id: string): Promise<CivicPR | undefined> {
  return requestOptionalJSON<CivicPR>(`/prs/${routeId(id)}`);
}

export async function getPRDiff(id: string): Promise<NormativeDiff[]> {
  return requestJSON<NormativeDiff[]>(`/prs/${routeId(id)}/diff`);
}

export async function getPRReviews(id: string): Promise<PRReview[]> {
  return requestJSON<PRReview[]>(`/prs/${routeId(id)}/reviews`);
}

export async function getPRChecks(id: string): Promise<InstitutionalCheck[]> {
  return requestJSON<InstitutionalCheck[]>(`/prs/${routeId(id)}/checks`);
}

export async function getReleases(): Promise<Release[]> {
  return requestJSON<Release[]>('/releases');
}

export async function getRelease(id: string): Promise<Release | undefined> {
  return requestOptionalJSON<Release>(`/releases/${routeId(id)}`);
}

export async function getExecutions(): Promise<ExecutionTracker[]> {
  return requestJSON<ExecutionTracker[]>('/executions');
}

export async function getPublicStats(): Promise<PublicStats> {
  return requestJSON<PublicStats>('/public-stats');
}

export async function getOPCycles(): Promise<OPCycle[]> {
  return requestJSON<OPCycle[]>('/op/cycles');
}

export async function getCurrentOPCycle(): Promise<OPCycle | undefined> {
  return requestOptionalJSON<OPCycle>('/op/cycles/current');
}

export async function getOPCycleById(id: string): Promise<OPCycle | undefined> {
  return requestOptionalJSON<OPCycle>(`/op/cycles/${routeId(id)}`);
}

// --- OP: administração do ciclo (instância geral) ----------------------------

export interface CycleConfigData {
  label: string;
  envelopeTotal: number; // centavos
  startsAt?: string; // ISO 8601
  loaDeadline?: string; // ISO 8601
}

export async function createOPCycle(data: CycleConfigData): Promise<OPCycle> {
  return postJSON<OPCycle>('/admin/op/cycles', data);
}

export async function configureOPCycle(id: string, data: CycleConfigData): Promise<OPCycle> {
  return postJSON<OPCycle>(`/admin/op/cycles/${routeId(id)}/configure`, data);
}

export async function advanceOPCycle(id: string, to?: string): Promise<OPCycle> {
  return postJSON<OPCycle>(`/admin/op/cycles/${routeId(id)}/advance`, { to });
}

export async function cancelOPCycle(id: string, reason: string): Promise<OPCycle> {
  return postJSON<OPCycle>(`/admin/op/cycles/${routeId(id)}/cancel`, { reason });
}

export async function getOPDemands(): Promise<BudgetDemand[]> {
  return requestJSON<BudgetDemand[]>('/op/demands');
}

export async function getOPDemandById(id: string): Promise<BudgetDemand | undefined> {
  return requestOptionalJSON<BudgetDemand>(`/op/demands/${routeId(id)}`);
}

export async function getTerritoryOPDemands(territoryId: string): Promise<BudgetDemand[]> {
  return requestJSON<BudgetDemand[]>(`/territories/${routeId(territoryId)}/demands`);
}

export async function getVotings(): Promise<Voting[]> {
  return requestJSON<Voting[]>('/votings');
}

export async function getVotingById(id: string): Promise<Voting | undefined> {
  return requestOptionalJSON<Voting>(`/votings/${routeId(id)}`);
}

// Compatibility aliases for existing front-end code and gradual migration.
export const getOrganicLaw = getOrganicLawArticles;
export const getInstitutionalChecks = getPRChecks;
export const getFiscalizacao = getExecutions;

export async function getOrganicLawVersions(): Promise<{ version: string; date: string; description: string }[]> {
  const releases = await getReleases();

  return releases.map(release => ({
    version: release.id,
    date: release.date,
    description: release.title
  }));
}

export async function getReleaseById(id: string): Promise<Release | undefined> {
  return getRelease(id);
}

export async function getFiscalizacaoById(id: string): Promise<ExecutionTracker | undefined> {
  const executions = await getExecutions();
  return executions.find(execution => execution.id === id);
}

export async function getTerritorySummary(id?: string): Promise<Territory | undefined> {
  const territories = await getTerritories();

  if (id) {
    return territories.find(territory => territory.id === id);
  }

  return territories[0];
}

// --- Autenticação de cidadão -------------------------------------------------

export interface AuthResponse {
  token: string;
  citizen: Citizen;
}

export interface RegisterCitizenData {
  fullName: string;
  cpf: string;
  birthDate: string;
  password?: string;
  phone?: string;
  email?: string;
  territoryId?: string;
}

export async function registerCitizen(data: RegisterCitizenData): Promise<AuthResponse> {
  return postJSON<AuthResponse>('/citizens/register', data);
}

export async function loginCitizen(cpf: string, password?: string, birthDate?: string): Promise<AuthResponse> {
  // O backend deve ser alterado para priorizar password, ou validar ambos no momento de transição
  return postJSON<AuthResponse>('/auth/login', { cpf, password, birthDate });
}

export async function getMe(): Promise<Citizen> {
  return requestJSON<Citizen>('/me');
}

// --- Administração: contexto de papéis ---------------------------------------

export type AdminLevel = 'technical' | 'general' | 'territorial';

export interface AdminMaintainerContext {
  id: string;
  territoryId?: string;
  territorySlug?: string;
  territoryName?: string;
  scope: 'territorial' | 'geral';
  status: string;
  appointmentSource?: string;
  termStart?: string;
  termEnd?: string;
  createdAt: string;
}

export interface AdminContext {
  citizenId: string;
  fullName: string;
  role: string;
  roleLabel: string;
  levels: AdminLevel[];
  canTechnical: boolean;
  canGeneral: boolean;
  canTerritorial: boolean;
  canManageAllTerritories: boolean;
  registeredTerritoryId?: string;
  registeredTerritorySlug?: string;
  registeredTerritoryName?: string;
  maintainers: AdminMaintainerContext[];
}

export async function getAdminContext(): Promise<AdminContext> {
  return requestJSON<AdminContext>('/me/admin-context');
}

// --- Escrita cívica autenticada ----------------------------------------------

export interface CreateIssueData {
  title: string;
  type: string;
  territory?: string;
  territoryId?: string;
  theme: string;
  description: string;
  assignedDepartment?: string;
  relatedArticleId?: string;
  relatedRepository?: string;
  linkedPRId?: string;
}

export async function createIssue(data: CreateIssueData): Promise<Issue> {
  return postJSON<Issue>('/issues', data);
}

export async function createIssueComment(issueId: string, content: string): Promise<Issue['comments'][number]> {
  return postJSON<Issue['comments'][number]>(`/issues/${routeId(issueId)}/comments`, { content });
}

export async function upvoteIssue(issueId: string): Promise<Issue> {
  return postJSON<Issue>(`/issues/${routeId(issueId)}/upvote`);
}

export async function updateIssueStatus(issueId: string, status: IssueStatus): Promise<Issue> {
  return postJSON<Issue>(`/issues/${routeId(issueId)}/status`, { status });
}

export interface CreateCivicPRData {
  title: string;
  repository: string;
  targetTitle: string;
  affectedArticles: string;
  authorType: string;
  citizenSummary: string;
  justification: string;
  diffs: NormativeDiff[];
  linkedIssueIds: string[];
}

export async function createCivicPR(data: CreateCivicPRData): Promise<CivicPR> {
  return postJSON<CivicPR>('/prs', data);
}

export async function createPRComment(prId: string, content: string): Promise<CivicPR['comments'][number]> {
  return postJSON<CivicPR['comments'][number]>(`/prs/${routeId(prId)}/comments`, { content });
}

export async function upvotePR(prId: string): Promise<CivicPR> {
  return postJSON<CivicPR>(`/prs/${routeId(prId)}/upvote`);
}

export async function updatePRStatus(prId: string, status: PRStatus): Promise<CivicPR> {
  return postJSON<CivicPR>(`/prs/${routeId(prId)}/status`, { status });
}

export interface PRTransitionInfo {
  key: string;
  toStatus: string;
  trigger: string;
  description: string;
}

export interface PRAllowedTransitions {
  currentStatus: string;
  workflowStage: string;
  terminal: boolean;
  transitions: PRTransitionInfo[];
}

/** Transições da máquina de estados que o cidadão autenticado pode disparar. */
export async function getPRTransitions(prId: string): Promise<PRAllowedTransitions> {
  return requestJSON<PRAllowedTransitions>(`/prs/${routeId(prId)}/transitions`);
}

// --- Orçamento Participativo: demandas simples -------------------------------

export interface CreateBudgetDemandData {
  territoryId: string;
  title: string;
  description?: string;
  location?: string;
  category: string;
}

export async function createOPDemand(data: CreateBudgetDemandData): Promise<BudgetDemand> {
  return postJSON<BudgetDemand>('/op/demands', data);
}

export async function supportOPDemand(id: string): Promise<BudgetDemand> {
  return postJSON<BudgetDemand>(`/op/demands/${routeId(id)}/support`);
}

export async function createOPDemandComment(id: string, content: string): Promise<BudgetDemandComment> {
  return postJSON<BudgetDemandComment>(`/op/demands/${routeId(id)}/comments`, { content });
}

export async function matureOPDemand(id: string, reason?: string): Promise<BudgetDemand> {
  return postJSON<BudgetDemand>(`/op/demands/${routeId(id)}/mature`, { reason });
}

export async function requestOPDemandInfo(id: string, reason: string): Promise<BudgetDemand> {
  return postJSON<BudgetDemand>(`/op/demands/${routeId(id)}/request-info`, { reason });
}

export async function validateOPDemandTerritory(id: string, reason?: string): Promise<BudgetDemand> {
  return postJSON<BudgetDemand>(`/op/demands/${routeId(id)}/validate-territory`, { reason });
}

export async function markOPDemandReady(id: string, reason?: string): Promise<BudgetDemand> {
  return postJSON<BudgetDemand>(`/op/demands/${routeId(id)}/mark-ready`, { reason });
}

export async function groupOPDemand(id: string, targetDemandId: string, reason: string): Promise<BudgetDemand> {
  return postJSON<BudgetDemand>(`/op/demands/${routeId(id)}/group`, { targetDemandId, reason });
}

export interface ForkBudgetDemandData {
  title: string;
  description?: string;
  location?: string;
  category?: string;
  reason?: string;
}

export async function forkOPDemand(id: string, data: ForkBudgetDemandData): Promise<BudgetDemand> {
  return postJSON<BudgetDemand>(`/op/demands/${routeId(id)}/fork`, data);
}

// --- Orçamento Participativo: propostas --------------------------------------

export async function getOPProposals(): Promise<BudgetProposal[]> {
  return requestJSON<BudgetProposal[]>('/op/proposals');
}

export async function getOPProposalById(id: string): Promise<BudgetProposal | undefined> {
  return requestOptionalJSON<BudgetProposal>(`/op/proposals/${routeId(id)}`);
}

export async function getTerritoryOPProposals(territoryId: string): Promise<BudgetProposal[]> {
  return requestJSON<BudgetProposal[]>(`/territories/${routeId(territoryId)}/proposals`);
}

export interface CreateBudgetProposalData {
  title?: string;
  problemSummary?: string;
  solutionScope: string;
  estimatedCostCents: number;
  category?: string;
}

export async function createOPProposalFromDemand(demandId: string, data: CreateBudgetProposalData): Promise<BudgetProposal> {
  return postJSON<BudgetProposal>(`/op/demands/${routeId(demandId)}/proposal`, data);
}

// --- Orçamento Participativo: votações territoriais --------------------------

export async function getOPVotings(): Promise<OPVoting[]> {
  return requestJSON<OPVoting[]>('/op/votings');
}

export async function getOPVotingById(id: string): Promise<OPVoting | undefined> {
  return requestOptionalJSON<OPVoting>(`/op/votings/${routeId(id)}`);
}

export async function getTerritoryOPVotings(territoryId: string): Promise<OPVoting[]> {
  return requestJSON<OPVoting[]>(`/territories/${routeId(territoryId)}/op-votings`);
}

export async function openOPVotingForProposal(proposalId: string): Promise<OPVoting> {
  return postJSON<OPVoting>(`/op/proposals/${routeId(proposalId)}/voting`);
}

export interface OPVotingResults extends VotingResults {}

export interface CastOPVoteResponse {
  receiptCode: string;
  voting: OPVoting;
  results: OPVotingResults;
}

export async function castOPVote(votingId: string, selection: VoteSelectionValue): Promise<CastOPVoteResponse> {
  return postJSON<CastOPVoteResponse>(`/op/votings/${routeId(votingId)}/vote`, { selection });
}

export async function getOPVotingResults(votingId: string): Promise<OPVotingResults> {
  return requestJSON<OPVotingResults>(`/op/votings/${routeId(votingId)}/results`);
}

// --- Votação ------------------------------------------------------------------

export interface VotingResults {
  id: string;
  title: string;
  status: string;
  deadline: string;
  quorumNeeded: number;
  quorumReached: number;
  quorumPercent: number;
  totalVotes: number;
  votesYes: number;
  votesNo: number;
  votesAbstain: number;
  yesPercent: number;
  noPercent: number;
  abstainPercent: number;
  approvalPercent: number;
}

export interface CastVoteResponse {
  receiptCode: string;
  voting: Voting;
  results: VotingResults;
}

export async function castVote(votingId: string, selection: VoteSelectionValue): Promise<CastVoteResponse> {
  return postJSON<CastVoteResponse>(`/votings/${routeId(votingId)}/vote`, { selection });
}

export async function getVotingResults(votingId: string): Promise<VotingResults> {
  return requestJSON<VotingResults>(`/votings/${routeId(votingId)}/results`);
}

// --- Merge institucional (papéis institucionais) -------------------------------

export interface MergePRData {
  version?: string;
  releaseTitle?: string;
  releaseDate?: string;
  officialDocumentUrl?: string;
  promulgatedBy: string;
  formalApprovalReference: string;
}

export interface MergePRResponse {
  pr: CivicPR;
  release: Release;
}

export async function mergePR(prId: string, data: MergePRData): Promise<MergePRResponse> {
  return postJSON<MergePRResponse>(`/prs/${routeId(prId)}/merge`, data);
}

// --- Painel do cidadão ---------------------------------------------------------

export async function getCitizenDashboard(): Promise<CitizenDashboardData> {
  return requestJSON<CitizenDashboardData>('/me/dashboard');
}

// --- Governança territorial: vínculo do cidadão ------------------------------

export type BondType = 'morador' | 'trabalhador' | 'estudante';
export type BondStatusValue = 'Pendente' | 'Aprovado' | 'Recusado' | 'Contestado' | 'Revogado';

export interface TerritoryBond {
  id: string;
  citizenId: string;
  citizenName: string;
  territoryId: string;
  territorySlug: string;
  territoryName: string;
  bondType: BondType;
  trustLevel: string;
  status: BondStatusValue;
  evidenceNote?: string;
  decisionReason?: string;
  decidedAt?: string;
  createdAt: string;
}

export interface TerritoryGovernance {
  territoryId: string;
  territoryName: string;
  hasActiveMaintainer: boolean;
  acceptsNewBonds: boolean;
  activeMaintainers: number;
  approvedBondsCount: number;
  pendingBondsCount: number;
  contestedBondsCount: number;
}

/** Meu vínculo territorial ativo, ou undefined se ainda não tenho um. */
export async function getMyBond(): Promise<TerritoryBond | undefined> {
  return requestOptionalJSON<TerritoryBond>('/me/bond');
}

export async function getTerritoryGovernance(territory: string): Promise<TerritoryGovernance> {
  return requestJSON<TerritoryGovernance>(`/territories/${routeId(territory)}/governance`);
}

export async function requestBond(
  territory: string,
  data: { bondType: BondType; evidenceNote?: string }
): Promise<TerritoryBond> {
  return postJSON<TerritoryBond>(`/territories/${routeId(territory)}/bonds`, data);
}

export async function appealBond(bondId: string, reason: string): Promise<unknown> {
  return postJSON(`/bonds/${routeId(bondId)}/appeal`, { reason });
}

// --- Governança territorial: validação pelo maintainer -----------------------

export async function listTerritoryBonds(territory: string, status?: string): Promise<TerritoryBond[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return requestJSON<TerritoryBond[]>(`/territories/${routeId(territory)}/bonds${query}`);
}

export async function decideBond(
  bondId: string,
  data: { approve: boolean; trustLevel?: string; reason?: string }
): Promise<TerritoryBond> {
  return postJSON<TerritoryBond>(`/bonds/${routeId(bondId)}/decision`, data);
}

// Still mocked until corresponding backend endpoints are implemented.
const delay = (ms = 150) => new Promise(resolve => setTimeout(resolve, ms));

export async function getRepositories() {
  await delay();
  return MOCK_REPOSITORIOS;
}

export async function getRepositoryBySlug(slug: string) {
  await delay();
  return MOCK_REPOSITORIOS.find(repo => repo.slug === slug);
}

export async function getAdminDashboard() {
  const [issues, prs, releases] = await Promise.all([
    getIssues(),
    getCivicPRs(),
    getReleases()
  ]);

  return {
    metrics: {
      openIssues: issues.length,
      prsInReview: prs.length,
      pendingReviews: prs.reduce((total, pr) => total + pr.reviews.filter(review => review.status === 'Pendente').length, 0),
      activeVotings: 0,
      releasesCount: releases.length,
      comentedArticles: 0
    },
    flaggedCommentsCount: 0
  };
}
