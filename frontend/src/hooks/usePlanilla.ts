import { useState, useCallback } from 'react';
import { planillaApi } from '../api/planilla';
import { Planilla, CreatePlanillaRequest, UpdatePlanillaRequest } from '../types';

export function usePlanilla() {
  const [planillas, setPlanillas] = useState<Planilla[]>([]);
  const [currentPlanilla, setCurrentPlanilla] = useState<Planilla | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const list = useCallback(async (params: {
    personal_id?: number;
    mes?: number;
    anio?: number;
    page?: number;
    limit?: number;
  } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await planillaApi.list(params);
      setPlanillas(response.data || []);
      setTotal(response.total);
      setPage(response.page);
      return response;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const planilla = await planillaApi.get(id);
      setCurrentPlanilla(planilla);
      return planilla;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (data: CreatePlanillaRequest) => {
    setLoading(true);
    setError(null);
    try {
      const newPlanilla = await planillaApi.create(data);
      setPlanillas((prev) => [newPlanilla, ...prev]);
      return newPlanilla;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (id: number, data: UpdatePlanillaRequest) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await planillaApi.update(id, data);
      setPlanillas((prev) => prev.map((p) => (p.id === id ? updated : p)));
      if (currentPlanilla?.id === id) {
        setCurrentPlanilla(updated);
      }
      return updated;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentPlanilla]);

  const remove = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await planillaApi.delete(id);
      setPlanillas((prev) => prev.filter((p) => p.id !== id));
      if (currentPlanilla?.id === id) {
        setCurrentPlanilla(null);
      }
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentPlanilla]);

  const prefill = useCallback(async (personalId: number, mes: number, anio: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await planillaApi.prefill(personalId, mes, anio);
      return response;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const changePage = useCallback((newPage: number, filters?: {
    personal_id?: number;
    mes?: number;
    anio?: number;
  }) => {
    list({ ...filters, page: newPage });
  }, [list]);

  return {
    planillas,
    currentPlanilla,
    total,
    page,
    loading,
    error,
    list,
    get,
    create,
    update,
    remove,
    prefill,
    changePage,
  };
}