import { useState, useCallback, useEffect, useRef } from 'react';
import { personalApi } from '../api/personal';
import { Personal, CreatePersonalRequest, UpdatePersonalRequest } from '../types';

export function usePersonal() {
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const search = useCallback(async (searchQuery: string, searchPage = 1) => {
    const q = searchQuery.length < 2 && searchPage === 1 ? '%' : searchQuery;

    setLoading(true);
    setError(null);
    try {
      const response = await personalApi.search(q, searchPage, 20);
      setPersonal(response.data || []);
      setTotal(response.total);
      setPage(response.page);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      search(value, 1);
    }, 400);
  }, [search]);

  const changePage = useCallback((newPage: number) => {
    search(query, newPage);
  }, [query, search]);

  const create = useCallback(async (data: CreatePersonalRequest) => {
    setLoading(true);
    setError(null);
    try {
      const newPersonal = await personalApi.create(data);
      setPersonal((prev) => [newPersonal, ...prev]);
      return newPersonal;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (id: number, data: UpdatePersonalRequest) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await personalApi.update(id, data);
      setPersonal((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return updated;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const remove = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await personalApi.delete(id);
      setPersonal((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    personal,
    total,
    page,
    loading,
    error,
    query,
    search,
    handleQueryChange,
    changePage,
    create,
    update,
    remove,
  };
}