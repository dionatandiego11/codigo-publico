/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  MOCK_MEB,
  MOCK_REPOSITORIOS,
  MOCK_VOTACOES
} from './mock-data';

import {
  CivicPR,
  ExecutionTracker,
  InstitutionalCheck,
  Issue,
  LawArticle,
  NormativeDiff,
  PRReview,
  Release,
  Territory,
  Voting
} from '../types';
import { requestJSON, requestOptionalJSON, routeId } from '../api/client';

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

// Still mocked until corresponding backend endpoints are implemented.
const delay = (ms = 150) => new Promise(resolve => setTimeout(resolve, ms));
let localVotings = [...MOCK_VOTACOES];

export async function getRepositories() {
  await delay();
  return MOCK_REPOSITORIOS;
}

export async function getRepositoryBySlug(slug: string) {
  await delay();
  return MOCK_REPOSITORIOS.find(repo => repo.slug === slug);
}

export async function createIssue(data: Omit<Issue, 'id' | 'createdAt' | 'status' | 'upvotes' | 'comments'>): Promise<Issue> {
  await delay(200);

  return {
    ...data,
    id: `#local-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'Aberta',
    upvotes: 1,
    comments: []
  };
}

export async function createCivicPR(data: Omit<CivicPR, 'id' | 'createdAt' | 'status' | 'upvotes' | 'comments' | 'reviews' | 'checks' | 'mergeTimeline'>): Promise<CivicPR> {
  await delay(200);

  return {
    ...data,
    id: `#local-${Date.now()}`,
    status: 'Rascunho',
    upvotes: 1,
    comments: [],
    createdAt: new Date().toISOString(),
    reviews: [],
    checks: [
      {
        id: 'chk-local-1',
        name: 'Compatibilidade com Constituição Federal',
        description: 'Pré-triagem automática local.',
        status: 'Pendente',
        feedback: 'Aguardando backend de revisão institucional.'
      }
    ],
    mergeTimeline: [
      {
        title: 'Abertura de Proposta',
        date: 'Hoje',
        completed: true,
        description: 'Proposta registrada localmente até o endpoint de criação ser implementado.'
      }
    ]
  };
}

export async function castVote(votingId: string, selection: 'Aprovo' | 'Rejeito' | 'Abstenção'): Promise<Voting | undefined> {
  await delay(300);

  const voteIndex = localVotings.findIndex(v => v.id === votingId);
  if (voteIndex === -1) {
    return undefined;
  }

  const updated = { ...localVotings[voteIndex] };
  updated.hasVoted = true;
  updated.userVoteSelection = selection;
  updated.voteReceipt = `CP-RECEIPT-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4).toUpperCase()}`;

  if (selection === 'Aprovo') updated.votesYes += 1;
  if (selection === 'Rejeito') updated.votesNo += 1;
  if (selection === 'Abstenção') updated.votesAbstain += 1;

  updated.quorumReached += 1;
  localVotings[voteIndex] = updated;

  MOCK_MEB.votedList.push({
    id: votingId,
    selection,
    receipt: updated.voteReceipt,
    txHash: `0x${Math.random().toString(16).slice(-16)}`
  });

  return updated;
}

export async function getVoteReceipt(votingId: string): Promise<string | undefined> {
  await delay();
  return localVotings.find(v => v.id === votingId)?.voteReceipt;
}

export async function getCitizenDashboard() {
  await delay();
  return MOCK_MEB;
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
