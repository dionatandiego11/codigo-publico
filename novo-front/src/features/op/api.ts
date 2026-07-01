import { api } from '../../shared/api/client';

export interface ApiTerritory {
  id: string;
  name: string;
  zone: string;
  activeCitizensCount: number;
}

export interface ApiRegimento {
  councilSize: number;
  supportThresholdPct: number;
  equalSharePct: number;
  structuringPct: number;
  maturationWindow: number;
}

export interface ApiCycle {
  id: string;
  label: string;
  phase: string;
  regimento: ApiRegimento;
  envelopeTotal: number;
  startsAt?: string;
}

export interface ApiCycleTerritoryEnvelope {
  territoryId: string;
  territoryName: string;
  carenciaWeight: number;
  equal: number;
  carencia: number;
  total: number;
}

export interface ApiDemandComment {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface ApiDemandEvent {
  id: string;
  demandId: string;
  actorId?: string;
  actorType: string;
  type: string;
  fromState?: string;
  toState?: string;
  visibility: string;
  payload: Record<string, any>;
  createdAt: string;
}

export interface ApiBudgetDemand {
  id: string;
  cycleId: string;
  territoryId: string;
  territoryName: string;
  title: string;
  description: string;
  location: string;
  category: string;
  status: string;
  supports: number;
  supportThreshold: number;
  supportReached: boolean;
  groupedIntoDemandId?: string;
  forkedFromDemandId?: string;
  comments: ApiDemandComment[];
  events?: ApiDemandEvent[];
  createdAt: string;
}

export interface ApiProposal {
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
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiOPVoting {
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
  status: string;
  scope?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiOPVoteResponse {
  receiptCode: string;
  voting: ApiOPVoting;
  results: {
    id: string;
    title: string;
    status: string;
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
  };
}

export interface ApiRankingItem {
  id: string;
  cycleId: string;
  territoryId: string;
  territoryName: string;
  demandId: string;
  proposalId: string;
  proposalTitle: string;
  votingId: string;
  position: number;
  votesYes: number;
  votesNo: number;
  votesAbstain: number;
  totalVotes: number;
  approvalPct: number;
  quorumReached: boolean;
  approved: boolean;
  status: string;
  frustrationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiCycleResultItem {
  position: number;
  proposalTitle: string;
  territoryId: string;
  territoryName: string;
  votesYes: number;
  votesNo: number;
  votesAbstain: number;
  totalVotes: number;
  approvalPct: number;
  quorumReached: boolean;
  approved: boolean;
  status: string;
}

export interface ApiCycleResultSnapshot {
  id?: string;
  cycleId: string;
  cycleLabel: string;
  frozen: boolean;
  generatedAt?: string;
  items: ApiCycleResultItem[];
}

export const opApi = {
  territories: () => api.get<ApiTerritory[]>('/territories'),
  currentCycle: () => api.get<ApiCycle>('/op/cycles/current'),
  cycleTerritoryEnvelopes: (cycleId: string) =>
    api.get<ApiCycleTerritoryEnvelope[]>(`/op/cycles/${encodeURIComponent(cycleId)}/territory-envelopes`),
  demands: () => api.get<ApiBudgetDemand[]>('/op/demands'),
  getDemand: (id: string) => api.get<ApiBudgetDemand>(`/op/demands/${encodeURIComponent(id)}`),
  createDemand: (data: { territoryId: string; title: string; description: string; category: string; location?: string }) =>
    api.post<ApiBudgetDemand>('/op/demands', data),
  supportDemand: (id: string) => api.post<ApiBudgetDemand>(`/op/demands/${encodeURIComponent(id)}/support`),
  commentDemand: (id: string, content: string) =>
    api.post<ApiDemandComment>(`/op/demands/${encodeURIComponent(id)}/comments`, { content }),
  forkDemand: (id: string, data: { title: string; description: string; category: string; reason: string }) =>
    api.post<ApiBudgetDemand>(`/op/demands/${encodeURIComponent(id)}/fork`, data),
  startMaturation: (id: string, reason: string) =>
    api.post<ApiBudgetDemand>(`/op/demands/${encodeURIComponent(id)}/mature`, { reason }),
  requestInfo: (id: string, reason: string) =>
    api.post<ApiBudgetDemand>(`/op/demands/${encodeURIComponent(id)}/request-info`, { reason }),
  validateTerritory: (id: string, reason: string) =>
    api.post<ApiBudgetDemand>(`/op/demands/${encodeURIComponent(id)}/validate-territory`, { reason }),
  markReady: (id: string, reason: string) =>
    api.post<ApiBudgetDemand>(`/op/demands/${encodeURIComponent(id)}/mark-ready`, { reason }),
  groupDemand: (id: string, targetDemandId: string, reason: string) =>
    api.post<ApiBudgetDemand>(`/op/demands/${encodeURIComponent(id)}/group`, { targetDemandId, reason }),
  approveDemand: (id: string, reason: string) =>
    api.post<ApiBudgetDemand>(`/op/demands/${encodeURIComponent(id)}/approve`, { reason }),
  rejectDemand: (id: string, category: string, reason: string) =>
    api.post<ApiBudgetDemand>(`/op/demands/${encodeURIComponent(id)}/reject`, { category, reason }),

  // Propostas
  proposals: () => api.get<ApiProposal[]>('/op/proposals'),
  createProposal: (demandId: string, data: {
    title: string;
    problemSummary: string;
    solutionScope: string;
    estimatedCostCents: number;
    category: string;
  }) => api.post<ApiProposal>(`/op/demands/${encodeURIComponent(demandId)}/proposal`, data),

  // Votações OP
  opVotings: () => api.get<ApiOPVoting[]>('/op/votings'),
  opVotingsByTerritory: (territoryId: string) =>
    api.get<ApiOPVoting[]>(`/territories/${encodeURIComponent(territoryId)}/op-votings`),
  getOPVoting: (id: string) => api.get<ApiOPVoting>(`/op/votings/${encodeURIComponent(id)}`),
  getOPVotingResults: (id: string) =>
    api.get<ApiOPVoteResponse['results']>(`/op/votings/${encodeURIComponent(id)}/results`),
  castOPVote: (votingId: string, selection: string) =>
    api.post<ApiOPVoteResponse>(`/op/votings/${encodeURIComponent(votingId)}/vote`, { selection }),
  openProposalVoting: (proposalId: string) =>
    api.post<ApiOPVoting>(`/op/proposals/${encodeURIComponent(proposalId)}/voting`),
  resolveOPVoting: (votingId: string) =>
    api.post<ApiOPVoting>(`/op/votings/${encodeURIComponent(votingId)}/resolve`),

  // Ranking
  ranking: (cycleId: string, territoryId?: string) =>
    api.get<ApiRankingItem[]>(
      `/op/cycles/${encodeURIComponent(cycleId)}/ranking${territoryId ? `?territory=${encodeURIComponent(territoryId)}` : ''}`
    ),
  updateRankingStatus: (itemId: string, status: string, reason?: string) =>
    api.post<ApiRankingItem>(`/admin/op/ranking/${encodeURIComponent(itemId)}/status`, { status, reason }),

  // Resultado congelado do ciclo
  cycleResults: (cycleId: string) =>
    api.get<ApiCycleResultSnapshot>(`/op/cycles/${encodeURIComponent(cycleId)}/results`),

  // Painel pessoal (dashboard) do cidadão logado
  meDashboard: () => api.get<ApiCitizenDashboard>('/me/dashboard'),

  // Governança territorial
  myBond: () => api.get<any>('/me/bond'),
  requestBond: (territoryId: string, data: { bondType: string; evidenceNote: string }) =>
    api.post<any>(`/territories/${encodeURIComponent(territoryId)}/bonds`, data),

  // ── Admin Macro & Identity ──────────────────────────────────────────────────
  adminListUsers: () => api.get<Array<{
    id: string;
    publicId: string;
    fullName: string;
    role: string;
    roleLabel: string;
    territoryId?: string;
    createdAt: string;
  }>>('/admin/users'),
  adminCreateUser: (data: { fullName: string; cpf: string; role: string }) =>
    api.post<{ publicId: string; message: string }>('/admin/users', data),
  adminUpdateUserRole: (userId: string, role: string) =>
    api.put<void>(`/admin/users/${encodeURIComponent(userId)}/role`, { role }),
  adminCreateTerritory: (data: { name: string; zone?: string }) =>
    api.post<{ id: string; name: string; slug: string; zone: string }>('/admin/territories', data),
  adminUpdateTerritory: (territoryId: string, data: { name: string; zone?: string }) =>
    api.put<void>(`/admin/territories/${encodeURIComponent(territoryId)}`, data),
};

export interface ApiDashboardIssueRef {
  id: string;
  title: string;
  status: string;
}

export interface ApiDashboardVoteReceipt {
  id: string;
  selection: string;
  receipt: string;
  txHash: string;
}

export interface ApiCitizenDashboard {
  name: string;
  email: string;
  territoryId: string;
  territoryName: string;
  registeredAt: string;
  citizenId: string;
  createdIssues: ApiDashboardIssueRef[];
  createdPRs: ApiDashboardIssueRef[];
  votedList: ApiDashboardVoteReceipt[];
  supportedPRs: string[];
}
