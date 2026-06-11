/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MOCK_REPOSITORIOS } from './mock-data';

import {
  Citizen,
  CitizenDashboardData,
  CivicPR,
  ExecutionTracker,
  InstitutionalCheck,
  Issue,
  IssueStatus,
  LawArticle,
  NormativeDiff,
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
  phone?: string;
  email?: string;
  territoryId?: string;
}

export async function registerCitizen(data: RegisterCitizenData): Promise<AuthResponse> {
  return postJSON<AuthResponse>('/citizens/register', data);
}

export async function loginCitizen(cpf: string, birthDate: string): Promise<AuthResponse> {
  return postJSON<AuthResponse>('/auth/login', { cpf, birthDate });
}

export async function getMe(): Promise<Citizen> {
  return requestJSON<Citizen>('/me');
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
