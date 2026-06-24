const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";
const TOKEN_STORAGE_KEY = "codigo-publico.auth.token";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function isNotFound(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 404;
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem("token");
}

export const tokenStorage = {
  get: getAuthToken,
  set(token: string) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.removeItem("token");
  },
  clear() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem("token");
  },
};

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

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData?.error) errorMsg = errorData.error;
    } catch (e) {
      // Ignore JSON parse errors
    }
    throw new ApiError(response.status, errorMsg);
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { ...options, method: "GET" }),
  post: <T>(endpoint: string, data?: any, options?: RequestInit) => request<T>(endpoint, { ...options, method: "POST", body: JSON.stringify(data) }),
  put: <T>(endpoint: string, data?: any, options?: RequestInit) => request<T>(endpoint, { ...options, method: "PUT", body: JSON.stringify(data) }),
  delete: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { ...options, method: "DELETE" }),
};

export const codigoPublicoApi = {
  territories: () => api.get<ApiTerritory[]>("/territories"),
  currentCycle: () => api.get<ApiCycle>("/op/cycles/current"),
  cycleTerritoryEnvelopes: (cycleId: string) => api.get<ApiCycleTerritoryEnvelope[]>(`/op/cycles/${encodeURIComponent(cycleId)}/territory-envelopes`),
  demands: () => api.get<ApiBudgetDemand[]>("/op/demands"),
  createDemand: (data: { territoryId: string; title: string; description: string; category: string; location?: string }) =>
    api.post<ApiBudgetDemand>("/op/demands", data),
  supportDemand: (id: string) => api.post<ApiBudgetDemand>(`/op/demands/${encodeURIComponent(id)}/support`),
  commentDemand: (id: string, content: string) =>
    api.post<ApiDemandComment>(`/op/demands/${encodeURIComponent(id)}/comments`, { content }),
  forkDemand: (id: string, data: { title: string; description: string; category: string; reason: string }) =>
    api.post<ApiBudgetDemand>(`/op/demands/${encodeURIComponent(id)}/fork`, data),
};
