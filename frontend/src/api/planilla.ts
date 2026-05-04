import fetchApi from './auth';
import { Planilla, CreatePlanillaRequest, UpdatePlanillaRequest, PaginatedResponse, PrefillResponse } from '../types';

interface PlanillaParams {
  personal_id?: number;
  mes?: number;
  anio?: number;
  page?: number;
  limit?: number;
}

export const planillaApi = {
  list: async (params: PlanillaParams = {}): Promise<PaginatedResponse<Planilla>> => {
    const searchParams = new URLSearchParams();
    if (params.personal_id) searchParams.set('personal_id', String(params.personal_id));
    if (params.mes) searchParams.set('mes', String(params.mes));
    if (params.anio) searchParams.set('anio', String(params.anio));
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    return fetchApi(`/planilla?${searchParams}`);
  },

  create: async (data: CreatePlanillaRequest): Promise<Planilla> => {
    return fetchApi('/planilla', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  get: async (id: number): Promise<Planilla> => {
    return fetchApi(`/planilla/${id}`);
  },

  update: async (id: number, data: UpdatePlanillaRequest): Promise<Planilla> => {
    return fetchApi(`/planilla/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<void> => {
    return fetchApi(`/planilla/${id}`, {
      method: 'DELETE',
    });
  },

  prefill: async (personalId: number, mes: number, anio: number): Promise<PrefillResponse> => {
    const params = new URLSearchParams({
      personal_id: String(personalId),
      mes: String(mes),
      anio: String(anio),
    });
    return fetchApi(`/planilla/prefill?${params}`);
  },

  exportExcel: async (params: PlanillaParams = {}): Promise<Blob> => {
    const searchParams = new URLSearchParams();
    if (params.personal_id) searchParams.set('personal_id', String(params.personal_id));
    if (params.mes) searchParams.set('mes', String(params.mes));
    if (params.anio) searchParams.set('anio', String(params.anio));
    
    const token = localStorage.getItem('token');
    const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/planilla/export?${searchParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Error al exportar');
    return response.blob();
  },
};