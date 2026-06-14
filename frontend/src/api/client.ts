/// <reference types="vite/client" />

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1';

const TOKEN_STORAGE_KEY = 'codigo-publico.auth.token';

/**
 * Armazenamento único do token de sessão do cidadão.
 * Toda requisição autenticada passa por aqui, evitando que
 * componentes manipulem localStorage diretamente.
 */
export const tokenStorage = {
  get(): string | null {
    try {
      return window.localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch {
      // Ambiente sem localStorage (SSR/teste): sessão vive só em memória.
    }
  },
  clear() {
    try {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // idem
    }
  }
};

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Erro de regra de negócio (4xx): a API está no ar e recusou a ação de forma
 * deliberada — transição inválida na máquina de estados, papel sem permissão,
 * payload inválido. Nunca deve sofrer fallback local, sob pena de a UI
 * desfazer a integridade institucional garantida pelo backend.
 */
export function isBusinessError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status >= 400 && error.status < 500;
}

export function routeId(id: string) {
  return encodeURIComponent(id);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');

  if (init.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  const token = tokenStorage.get();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const body = await response.json();
      if (body && typeof body.error === 'string') {
        message = body.error;
      }
    } catch {
      // Corpo não-JSON: mantém a mensagem de status.
    }

    throw new ApiError(response.status, message);
  }

  return response.json() as Promise<T>;
}

export async function requestJSON<T>(path: string): Promise<T> {
  return request<T>(path);
}

export async function requestOptionalJSON<T>(path: string): Promise<T | undefined> {
  try {
    return await request<T>(path);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return undefined;
    }
    throw error;
  }
}

export async function postJSON<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: body === undefined ? JSON.stringify({}) : JSON.stringify(body)
  });
}
