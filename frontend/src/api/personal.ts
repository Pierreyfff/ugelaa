import fetchApi from './auth';
import { Personal, CreatePersonalRequest, UpdatePersonalRequest, PaginatedResponse } from '../types';

export const personalApi = {
  search: async (query: string, page = 1, limit = 20): Promise<PaginatedResponse<Personal>> => {
    const params = new URLSearchParams({
      q: query,
      page: String(page),
      limit: String(limit),
    });
    return fetchApi(`/personal?${params}`);
  },

  getByDNI: async (dni: string): Promise<Personal> => {
    return fetchApi(`/personal/dni/${dni}`);
  },

  create: async (data: CreatePersonalRequest): Promise<Personal> => {
    return fetchApi('/personal', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  get: async (id: number): Promise<Personal> => {
    return fetchApi(`/personal/${id}`);
  },

  update: async (id: number, data: UpdatePersonalRequest): Promise<Personal> => {
    return fetchApi(`/personal/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<void> => {
    return fetchApi(`/personal/${id}`, {
      method: 'DELETE',
    });
  },
};