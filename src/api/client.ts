/// <reference types="vite/client" />

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1';

export function routeId(id: string) {
  return encodeURIComponent(id);
}

export async function requestJSON<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function requestOptionalJSON<T>(path: string): Promise<T | undefined> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      Accept: 'application/json'
    }
  });

  if (response.status === 404) {
    return undefined;
  }

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}
