import { create } from 'zustand';
import { Usuario } from '../types';
import { authApi } from '../api/auth';

interface AuthState {
  user: Usuario | null;
  isAuthenticated: boolean;
  csrfToken: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setCsrfToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  csrfToken: null,
  isLoading: true,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login({ email, password });
      set({
        user: response.user,
        isAuthenticated: true,
        csrfToken: response.csrf_token,
        isLoading: false,
      });
      localStorage.setItem('csrf_token', response.csrf_token);
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authApi.logout();
    } catch {
    } finally {
      set({ user: null, isAuthenticated: false, csrfToken: null, isLoading: false });
      localStorage.removeItem('csrf_token');
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const user = await authApi.me();
      const csrfToken = localStorage.getItem('csrf_token');
      set({
        user: user as Usuario,
        isAuthenticated: true,
        csrfToken,
        isLoading: false,
      });
    } catch {
      set({ user: null, isAuthenticated: false, csrfToken: null, isLoading: false });
    }
  },

  setCsrfToken: (token) => {
    set({ csrfToken: token });
    localStorage.setItem('csrf_token', token);
  },
}));