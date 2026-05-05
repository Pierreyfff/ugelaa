import { LoginRequest, LoginResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(error.error || 'Error en la solicitud');
  }

  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json();
  
  if (endpoint === '/auth/me' && response.ok) {
    return data;
  }
  
  return data as T;
}

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    return fetchApi<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  logout: async (): Promise<void> => {
    return fetchApi('/auth/logout', {
      method: 'POST',
    });
  },

  me: async () => {
    return fetchApi('/auth/me');
  },

  refresh: async (): Promise<TokenPair> => {
    return fetchApi<TokenPair>('/auth/refresh', {
      method: 'POST',
    });
  },

  checkSession: async (): Promise<boolean> => {
    try {
      await fetchApi('/auth/me');
      return true;
    } catch {
      return false;
    }
  },
};

export default fetchApi;