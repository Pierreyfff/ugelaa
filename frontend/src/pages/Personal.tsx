import { useEffect, useState } from 'react'
import { personalApi } from '../services/api'
import { Search, Plus, Pencil, Trash2, X, User, Briefcase, Hash, Building, Tag, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react'

interface Personal {
  id: number
  dni: string
  nombres: string
  apellidos: string
  puesto: string
  rd: string
  uu: string
  colegio: string
  distrito: string
}

interface PaginationData {
  data: Personal[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export default function Personal() {
  const [personal, setPersonal] = useState<Personal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Personal | null>(null)
  const [form, setForm] = useState({ dni: '', nombres: '', apellidos: '', puesto: '', rd: '', uu: '', colegio: '', distrito: '' })
  const [errors, setErrors] = useState<{ nombres?: string; apellidos?: string }>({})

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    loadPersonal()
  }, [debouncedSearch, page])

  const loadPersonal = () => {
    setLoading(true)
    personalApi.list(debouncedSearch, page, 20, 'apellidos', 'asc')
      .then((res: { data: PaginationData }) => {
        setPersonal(res.data.data)
        setTotal(res.data.total)
        setTotalPages(res.data.total_pages)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const validateForm = () => {
    const newErrors: { nombres?: string; apellidos?: string } = {}
    if (!form.nombres.trim()) newErrors.nombres = 'El nombre es requerido'
    if (!form.apellidos.trim()) newErrors.apellidos = 'Los apellidos son requeridos'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      if (editing) {
        await personalApi.update(editing.id, form)
      } else {
        await personalApi.create(form)
      }
      setShowModal(false)
      setEditing(null)
      setForm({ dni: '', nombres: '', apellidos: '', puesto: '', rd: '', uu: '', colegio: '', distrito: '' })
      setErrors({})
      loadPersonal()
    } catch (error) {
      console.error(error)
    }
  }

  const handleEdit = (p: Personal) => {
    setEditing(p)
    setForm({
      dni: p.dni || '',
      nombres: p.nombres,
      apellidos: p.apellidos,
      puesto: p.puesto || '',
      rd: p.rd || '',
      uu: p.uu || '',
      colegio: p.colegio || '',
      distrito: p.distrito || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('¿Eliminar este empleado?')) {
      try {
        await personalApi.delete(id)
        loadPersonal()
      } catch (error) {
        console.error(error)
      }
    }
  }

  const getPaginationRange = () => {
    const range: number[] = []
    const maxVisible = 5
    let start = Math.max(1, page - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }
    for (let i = start; i <= end; i++) {
      range.push(i)
    }
    return range
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg">
              <User className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-semibold text-red-600">Gestión de Empleados</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Personal</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Administra los empleados de tu organización</p>
        </div>
        <button
          onClick={() => {
            setEditing(null)
setForm({ dni: '', nombres: '', apellidos: '', puesto: '', rd: '', uu: '', colegio: '', distrito: '' })
            setErrors({})
            setShowModal(true)
          }}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Empleado</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Total Empleados</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{total}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-gray-600 dark:text-gray-300" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{total}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{total}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
              <XCircle className="w-6 h-6 text-gray-400 dark:text-gray-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o DNI..."
                  className="pl-10 pr-10 py-2.5 w-64 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:border-red-500 transition-all text-gray-900 dark:text-white placeholder:text-gray-400"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                />
                {searchInput && (
                  <button onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium">
                {total} empleados
              </span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-5 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-xl animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-4 w-48 bg-gray-200 dark:bg-gray-600 rounded animate-pulse mb-2"></div>
                  <div className="h-3 w-32 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : personal.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No hay empleados</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Comienza agregando tu primer empleado</p>
            <button onClick={() => setShowModal(true)} className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Agregar Empleado</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                  <th className="text-left py-4 px-5">Empleado</th>
                  <th className="text-left py-4 px-4">DNI</th>
                  <th className="text-left py-4 px-4">Puesto</th>
                  <th className="text-left py-4 px-4">Colegio</th>
                  <th className="text-left py-4 px-4">Distrito</th>
                  <th className="text-left py-4 px-4">RD</th>
                  <th className="text-left py-4 px-4">UU</th>
                  <th className="text-right py-4 px-5">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {personal.map(p => (
                  <tr key={p.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {p.nombres?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{p.apellidos} {p.nombres}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{p.puesto || 'Sin puesto'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg text-gray-700 dark:text-gray-300">{p.dni || '-'}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{p.puesto || '-'}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{p.colegio || '-'}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{p.distrito || '-'}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-mono text-sm text-gray-500 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded dark:text-gray-400">{p.rd || '-'}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-mono text-sm text-gray-500 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded dark:text-gray-400">{p.uu || '-'}</span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(p)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-all" title="Editar">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-all" title="Eliminar">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Mostrando <span className="font-semibold text-gray-700 dark:text-gray-300">{(page - 1) * 20 + 1}</span> - <span className="font-semibold text-gray-700 dark:text-gray-300">{Math.min(page * 20, total)}</span> de <span className="font-semibold text-red-600 dark:text-red-400">{total}</span>
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(1)} disabled={page === 1} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-gray-500 dark:text-gray-400 transition-all">
                    <ChevronLeft className="w-4 h-4" /><ChevronLeft className="w-3 h-3 -ml-2" />
                  </button>
                  {getPaginationRange().map(pageNum => (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                        page === pageNum
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600 dark:text-gray-300 transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 bg-gradient-to-r from-red-600 to-red-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    {editing ? <Pencil className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-white" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{editing ? 'Editar Empleado' : 'Nuevo Empleado'}</h3>
                    <p className="text-white/70 text-sm">{editing ? 'Actualiza los datos' : 'Completa los datos del empleado'}</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <Hash className="w-4 h-4 inline mr-1" /> DNI
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:border-red-500 transition-all text-gray-900 dark:text-white placeholder:text-gray-400"
                    value={form.dni}
                    onChange={e => setForm({ ...form, dni: e.target.value })}
                    placeholder="12345678"
                    maxLength={8}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <Briefcase className="w-4 h-4 inline mr-1" /> Puesto
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:border-red-500 transition-all text-gray-900 dark:text-white placeholder:text-gray-400"
                    value={form.puesto}
                    onChange={e => setForm({ ...form, puesto: e.target.value })}
                    placeholder="Puesto laboral"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Colegio
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:border-red-500 transition-all text-gray-900 dark:text-white placeholder:text-gray-400"
                    value={form.colegio}
                    onChange={e => setForm({ ...form, colegio: e.target.value })}
                    placeholder="Nombre del colegio"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Distrito
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:border-red-500 transition-all text-gray-900 dark:text-white placeholder:text-gray-400"
                    value={form.distrito}
                    onChange={e => setForm({ ...form, distrito: e.target.value })}
                    placeholder="Distrito"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <User className="w-4 h-4 inline mr-1" /> Nombres *
                </label>
                <input
                  type="text"
                  className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border-2 ${errors.nombres ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-600'} rounded-lg focus:outline-none focus:border-red-500 transition-all text-gray-900 dark:text-white placeholder:text-gray-400`}
                  value={form.nombres}
                  onChange={e => { setForm({ ...form, nombres: e.target.value }); if (errors.nombres) setErrors({ ...errors, nombres: undefined }) }}
                  placeholder="Nombres completos"
                />
                {errors.nombres && <p className="text-sm text-red-600 dark:text-red-400 font-medium mt-1">{errors.nombres}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <User className="w-4 h-4 inline mr-1" /> Apellidos *
                </label>
                <input
                  type="text"
                  className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border-2 ${errors.apellidos ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-600'} rounded-lg focus:outline-none focus:border-red-500 transition-all text-gray-900 dark:text-white placeholder:text-gray-400`}
                  value={form.apellidos}
                  onChange={e => { setForm({ ...form, apellidos: e.target.value }); if (errors.apellidos) setErrors({ ...errors, apellidos: undefined }) }}
                  placeholder="Apellidos completos"
                />
                {errors.apellidos && <p className="text-sm text-red-600 dark:text-red-400 font-medium mt-1">{errors.apellidos}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <Tag className="w-4 h-4 inline mr-1" /> RD
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:border-red-500 transition-all text-gray-900 dark:text-white placeholder:text-gray-400"
                    value={form.rd}
                    onChange={e => setForm({ ...form, rd: e.target.value })}
                    placeholder="RD"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <Building className="w-4 h-4 inline mr-1" /> UU
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:border-red-500 transition-all text-gray-900 dark:text-white placeholder:text-gray-400"
                    value={form.uu}
                    onChange={e => setForm({ ...form, uu: e.target.value })}
                    placeholder="UU"
                  />
                </div>
              </div>

              

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editing ? 'Actualizar' : 'Crear Empleado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}