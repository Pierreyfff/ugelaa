import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'
export const PYTHON_URL = import.meta.env.VITE_PYTHON_URL || '/python'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const personalApi = {
  list: (search?: string, page = 1, limit = 20, sortBy = 'apellidos', sortOrder = 'asc', mes?: number | string, anio?: number | string, institucion?: string, distrito?: string, rd?: string, uu?: string) => 
    api.get('/api/personal', { params: { search, page, limit, sort_by: sortBy, sort_order: sortOrder, mes, anio, institucion, distrito, rd, uu } }),
  buscar: (q: string, limit = 10) => api.get('/api/personal/buscar', { params: { q, limit } }),
  get: (id: number) => api.get(`/api/personal/${id}`),
  create: (data: any) => api.post('/api/personal', data),
  update: (id: number, data: any) => api.put(`/api/personal/${id}`, data),
  delete: (id: number) => api.delete(`/api/personal/${id}`),
  getPeriodos: (id: number) => api.get(`/api/personal/${id}/periodos`),
  exportar: (id: number, mes?: number, anio?: number) => 
    api.get(`/api/personal/${id}/exportar`, { params: { mes, anio } }),
  instituciones: (q: string) => api.get('/api/personal/instituciones', { params: { q, limit: 10 } }),
  distritos: (q: string) => api.get('/api/personal/distritos', { params: { q, limit: 10 } }),
}

export const planillasApi = {
  list: (mes?: number | string, anio?: number | string, page = 1, limit = 20, search?: string, sortBy = 'anio', sortOrder = 'desc') =>
    api.get('/api/planillas', { params: { mes, anio, page, limit, search, sort_by: sortBy, sort_order: sortOrder } }),
  get: (id: number) => api.get(`/api/planillas/${id}`),
  create: (data: any) => api.post('/api/planillas', data),
  update: (id: number, data: any) => api.put(`/api/planillas/${id}`, data),
  delete: (id: number) => api.delete(`/api/planillas/${id}`),
  editarCompleta: (id: number, data: any) => api.put(`/api/planillas/${id}/editar`, data),
}

export const ingresosApi = {
  create: (data: any) => api.post('/api/ingresos', data),
  update: (id: number, data: any) => api.put(`/api/ingresos/${id}`, data),
  delete: (id: number) => api.delete(`/api/ingresos/${id}`),
}

export const descuentosApi = {
  create: (data: any) => api.post('/api/descuentos', data),
  update: (id: number, data: any) => api.put(`/api/descuentos/${id}`, data),
  delete: (id: number) => api.delete(`/api/descuentos/${id}`),
}

export const dashboardApi = {
  getResumen: (mes?: number, anio?: number) => api.get('/api/dashboard/resumen', { params: { mes, anio } }),
}

export const importarApi = {
  excel: (file: File, mes: number, anio: number) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('mes', String(mes))
    formData.append('anio', String(anio))
    return fetch(`${PYTHON_URL}/process-excel`, { method: 'POST', body: formData })
      .then(r => r.json())
  },
  limpiar: (mes: number, anio: number) =>
    api.delete('/api/importar/limpiar', { params: { mes, anio } }),
  limpiarTodo: () =>
    api.delete('/api/importar/limpiar-todo'),
  periodos: () => api.get('/api/importar/periodos'),
}

export default api
