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
  forkedFromDemandId?: string;
  comments: ApiDemandComment[];
  createdAt: string;
}

export const opApi = {
  territories: () => api.get<ApiTerritory[]>('/territories'),
  currentCycle: () => api.get<ApiCycle>('/op/cycles/current'),
  cycleTerritoryEnvelopes: (cycleId: string) =>
    api.get<ApiCycleTerritoryEnvelope[]>(`/op/cycles/${encodeURIComponent(cycleId)}/territory-envelopes`),
  demands: () => api.get<ApiBudgetDemand[]>('/op/demands'),
  createDemand: (data: { territoryId: string; title: string; description: string; category: string; location?: string }) =>
    api.post<ApiBudgetDemand>('/op/demands', data),
  supportDemand: (id: string) => api.post<ApiBudgetDemand>(`/op/demands/${encodeURIComponent(id)}/support`),
  commentDemand: (id: string, content: string) =>
    api.post<ApiDemandComment>(`/op/demands/${encodeURIComponent(id)}/comments`, { content }),
  forkDemand: (id: string, data: { title: string; description: string; category: string; reason: string }) =>
    api.post<ApiBudgetDemand>(`/op/demands/${encodeURIComponent(id)}/fork`, data),
};
