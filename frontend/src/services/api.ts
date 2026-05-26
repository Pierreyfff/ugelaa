import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const personalApi = {
<<<<<<< Updated upstream
  list: (search?: string, page = 1, limit = 20, sortBy = 'apellidos', sortOrder = 'asc', activo?: boolean) => 
    api.get('/api/personal', { params: { search, page, limit, sort_by: sortBy, sort_order: sortOrder, activo } }),
=======
  list: (search?: string, page = 1, limit = 20, sortBy = 'apellidos', sortOrder = 'asc', mes?: number, anio?: number) => 
    api.get('/api/personal', { params: { search, page, limit, sort_by: sortBy, sort_order: sortOrder, mes, anio } }),
>>>>>>> Stashed changes
  buscar: (q: string, limit = 10) => api.get('/api/personal/buscar', { params: { q, limit } }),
  get: (id: number) => api.get(`/api/personal/${id}`),
  create: (data: any) => api.post('/api/personal', data),
  update: (id: number, data: any) => api.put(`/api/personal/${id}`, data),
  delete: (id: number) => api.delete(`/api/personal/${id}`),
  getPeriodos: (id: number) => api.get(`/api/personal/${id}/periodos`),
  exportar: (id: number, mes?: number, anio?: number) => 
    api.get(`/api/personal/${id}/exportar`, { params: { mes, anio } }),
}

export const dashboardApi = {
  getResumen: () => api.get('/api/dashboard/resumen'),
}

export const importarApi = {
  excel: (file: File, mes: number, anio: number) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('mes', String(mes))
    formData.append('anio', String(anio))
    return fetch('/python/process-excel', { method: 'POST', body: formData })
      .then(r => r.json())
  },
}

export default api