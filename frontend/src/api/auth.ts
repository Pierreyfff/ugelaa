import { LoginRequest, LoginResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const csrfToken = localStorage.getItem('csrf_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (csrfToken && ['POST', 'PUT', 'DELETE'].includes(options.method || '')) {
    (headers as Record<string, string>)['X-CSRF-Token'] = csrfToken;
  }

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

  return response.json();
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

  refresh: async (refreshToken: string) => {
    return fetchApi('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  },
};

export default fetchApi;