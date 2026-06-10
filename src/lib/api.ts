/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  MOCK_ARTIGOS,
  MOCK_REPOSITORIOS,
  MOCK_ISSUES,
  MOCK_PRS,
  MOCK_VOTACOES,
  MOCK_RELEASES,
  MOCK_FISCALIZACOES,
  MOCK_TERRITORIOS,
  MOCK_ESTATISTICAS,
  MOCK_MEB
} from './mock-data';

import { LawArticle, Issue, CivicPR, Voting, Release, ExecutionTracker, Territory } from '../types';

// Helper function to simulate short network latency, mimicking Go framework APIs
const delay = (ms = 150) => new Promise(resolve => setTimeout(resolve, ms));

// Session cache to support adding issues/PRs in the client session state
let localIssues = [...MOCK_ISSUES];
let localPRs = [...MOCK_PRS];
let localVotings = [...MOCK_VOTACOES];

export async function getOrganicLaw(): Promise<LawArticle[]> {
  await delay();
  return MOCK_ARTIGOS;
}

export async function getOrganicLawArticle(id: string): Promise<LawArticle | undefined> {
  await delay();
  return MOCK_ARTIGOS.find(art => art.id === id || `art-${art.number}` === id);
}

export async function getOrganicLawVersions(): Promise<{ version: string; date: string; description: string }[]> {
  await delay();
  return [
    { version: 'v2026.0', date: '10/01/2026', description: 'Versão consolidada atual com as Emendas Sociais de 2025.' },
    { version: 'v2024.1', date: '12/12/2024', description: 'Inclui emenda de incentivo à agricultura familiar.' },
    { version: 'v2024.0', date: '10/06/2024', description: 'Incorpora diretriz essencial sobre transparência climática.' }
  ];
}

export async function getRepositories() {
  await delay();
  return MOCK_REPOSITORIOS;
}

export async function getRepositoryBySlug(slug: string) {
  await delay();
  return MOCK_REPOSITORIOS.find(repo => repo.slug === slug);
}

export async function getIssues(): Promise<Issue[]> {
  await delay();
  return localIssues;
}

export async function getIssueById(id: string): Promise<Issue | undefined> {
  await delay();
  return localIssues.find(issue => issue.id === id);
}

export async function createIssue(data: Omit<Issue, 'id' | 'createdAt' | 'status' | 'upvotes' | 'comments'>): Promise<Issue> {
  await delay(200);
  const newId = `#${String(localIssues.length + 118).padStart(3, '0')}`;
  const newIssue: Issue = {
    ...data,
    id: newId,
    createdAt: new Date().toISOString(),
    status: 'Aberta',
    upvotes: 1,
    comments: [],
  };
  localIssues.unshift(newIssue);
  return newIssue;
}

export async function getCivicPRs(): Promise<CivicPR[]> {
  await delay();
  return localPRs;
}

export async function getCivicPRById(id: string): Promise<CivicPR | undefined> {
  await delay();
  return localPRs.find(pr => pr.id === id);
}

export async function createCivicPR(data: Omit<CivicPR, 'id' | 'createdAt' | 'status' | 'upvotes' | 'comments' | 'reviews' | 'checks' | 'mergeTimeline'>): Promise<CivicPR> {
  await delay(200);
  const newId = `#0${localPRs.length + 45}`;
  const newPR: CivicPR = {
    ...data,
    id: newId,
    status: 'Rascunho',
    upvotes: 1,
    comments: [],
    createdAt: new Date().toISOString(),
    reviews: [],
    checks: [
      { id: 'chk-auto-1', name: 'Compatibilidade com Constituição Federal', description: 'Pré-triagem automática', status: 'Pendente', feedback: 'Aguardando validação jurídica formal.' },
      { id: 'chk-auto-2', name: 'Competência municipal', description: 'Validação de escopo', status: 'Aprovado', feedback: 'O tema se enquadra nas competências locais da prefeitura.' }
    ],
    mergeTimeline: [
      { title: 'Abertura de Proposta', date: 'Hoje', completed: true, description: 'Proposta registrada sob rascunho legislativo no repositório.' },
      { title: 'Revisão Técnica de Admissão', date: 'Pendente', completed: false, description: 'Fila de análise tecnológica da controladoria.' }
    ]
  };
  localPRs.unshift(newPR);
  return newPR;
}

export async function getPRDiff(id: string) {
  await delay();
  const pr = localPRs.find(p => p.id === id);
  return pr ? pr.diffs : [];
}

export async function getPRReviews(id: string) {
  await delay();
  const pr = localPRs.find(p => p.id === id);
  return pr ? pr.reviews : [];
}

export async function getInstitutionalChecks(id: string) {
  await delay();
  const pr = localPRs.find(p => p.id === id);
  return pr ? pr.checks : [];
}

export async function castVote(votingId: string, selection: 'Aprovo' | 'Rejeito' | 'Abstenção'): Promise<Voting | undefined> {
  await delay(300);
  const voteIndex = localVotings.findIndex(v => v.id === votingId);
  if (voteIndex !== -1) {
    const updated = { ...localVotings[voteIndex] };
    updated.hasVoted = true;
    updated.userVoteSelection = selection;
    updated.voteReceipt = `CP-RECEIPT-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4).toUpperCase()}`;
    
    if (selection === 'Aprovo') updated.votesYes += 1;
    if (selection === 'Rejeito') updated.votesNo += 1;
    if (selection === 'Abstenção') updated.votesAbstain += 1;

    updated.quorumReached += 1;
    localVotings[voteIndex] = updated;

    // Track in citizen dashboard
    MOCK_MEB.votedList.push({
      id: votingId,
      selection,
      receipt: updated.voteReceipt,
      txHash: `0x${Math.random().toString(16).slice(-16)}`
    });

    return updated;
  }
  return undefined;
}

export async function getVoteReceipt(votingId: string): Promise<string | undefined> {
  await delay();
  return localVotings.find(v => v.id === votingId)?.voteReceipt;
}

export async function getReleases(): Promise<Release[]> {
  await delay();
  return MOCK_RELEASES;
}

export async function getReleaseById(id: string): Promise<Release | undefined> {
  await delay();
  return MOCK_RELEASES.find(rel => rel.id === id);
}

export async function getFiscalizacao(): Promise<ExecutionTracker[]> {
  await delay();
  return MOCK_FISCALIZACOES;
}

export async function getFiscalizacaoById(id: string): Promise<ExecutionTracker | undefined> {
  await delay();
  return MOCK_FISCALIZACOES.find(f => f.id === id);
}

export async function getCitizenDashboard() {
  await delay();
  return MOCK_MEB;
}

export async function getTerritorySummary(id?: string): Promise<Territory | undefined> {
  await delay();
  if (id) {
    return MOCK_TERRITORIOS.find(t => t.id === id);
  }
  return MOCK_TERRITORIOS[0]; // Retorna Campo Grande por padrão
}

export async function getPublicStats() {
  await delay();
  return {
    ...MOCK_ESTATISTICAS,
    openIssuesCount: localIssues.length,
    prsInReviewCount: localPRs.length,
    activeVotingsCount: localVotings.filter(v => !v.hasVoted).length
  };
}

export async function getAdminDashboard() {
  await delay();
  return {
    metrics: {
      openIssues: localIssues.length,
      prsInReview: localPRs.length,
      pendingReviews: 3,
      activeVotings: localVotings.length,
      releasesCount: MOCK_RELEASES.length,
      comentedArticles: 14
    },
    flaggedCommentsCount: 0
  };
}
