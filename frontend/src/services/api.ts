import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const personalApi = {
  list: (search?: string) => api.get('/api/personal', { params: { search } }),
  get: (id: number) => api.get(`/api/personal/${id}`),
  create: (data: any) => api.post('/api/personal', data),
  update: (id: number, data: any) => api.put(`/api/personal/${id}`, data),
  delete: (id: number) => api.delete(`/api/personal/${id}`),
}

export const planillasApi = {
  list: (mes?: number, anio?: number) => api.get('/api/planillas', { params: { mes, anio } }),
  get: (id: number) => api.get(`/api/planillas/${id}`),
  create: (data: any) => api.post('/api/planillas', data),
  update: (id: number, data: any) => api.put(`/api/planillas/${id}`, data),
  delete: (id: number) => api.delete(`/api/planillas/${id}`),
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