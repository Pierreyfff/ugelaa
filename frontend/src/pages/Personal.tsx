import { useEffect, useMemo, useState } from 'react'
import { personalApi } from '../services/api'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  User,
  Briefcase,
  Hash,
  Building,
  Tag,
  CheckCircle,
  XCircle,
  UserCheck,
  Users,
} from 'lucide-react'

interface Personal {
  id: number
  dni: string
  nombres: string
  apellidos: string
  puesto: string
  rd: string
  uu: string
  activo: boolean
}

function Modal({
  title,
  subtitle,
  onClose,
  children,
  maxWidthClass = 'max-w-lg',
}: {
  title: string
  subtitle?: string
  onClose: () => void
  children: React.ReactNode
  maxWidthClass?: string
}) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-[95vw] ${maxWidthClass} max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-white`}>
        <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-slate-950 to-slate-900">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white">{title}</h3>
              {subtitle && <p className="text-xs sm:text-sm text-slate-300 mt-1">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-all"
              aria-label="Cerrar"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-64px)]">
          {children}
        </div>
      </div>
    </div>
  )
}

export default function Personal() {
  const [personal, setPersonal] = useState<Personal[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Personal | null>(null)

  const [confirmDelete, setConfirmDelete] = useState<{ id: number; label: string } | null>(null)

  const [form, setForm] = useState({
    dni: '',
    nombres: '',
    apellidos: '',
    puesto: '',
    rd: '',
    uu: '',
    activo: true,
  })

  const [errors, setErrors] = useState<{ nombres?: string; apellidos?: string }>({})

  useEffect(() => {
    loadPersonal()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const loadPersonal = () => {
    setLoading(true)
    personalApi
      .list(search)
      .then((res) => setPersonal(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const activeCount = useMemo(() => personal.filter((p) => p.activo).length, [personal])

  const validateForm = () => {
    const newErrors: { nombres?: string; apellidos?: string } = {}
    if (!form.nombres.trim()) newErrors.nombres = 'El nombre es requerido'
    if (!form.apellidos.trim()) newErrors.apellidos = 'Los apellidos son requeridos'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ dni: '', nombres: '', apellidos: '', puesto: '', rd: '', uu: '', activo: true })
    setErrors({})
    setShowModal(true)
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
      setForm({ dni: '', nombres: '', apellidos: '', puesto: '', rd: '', uu: '', activo: true })
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
      activo: p.activo,
    })
    setErrors({})
    setShowModal(true)
  }

  const requestDelete = (p: Personal) => {
    setConfirmDelete({ id: p.id, label: `${p.apellidos} ${p.nombres}`.trim() })
  }

  const doDelete = async () => {
    if (!confirmDelete) return
    await personalApi.delete(confirmDelete.id)
    setConfirmDelete(null)
    loadPersonal()
  }

  const toggleActivo = async (p: Personal) => {
    await personalApi.update(p.id, { activo: !p.activo })
    loadPersonal()
  }

  return (
    <div className="space-y-6">
      {/* ===== Header ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <UserCheck className="w-5 h-5 text-rose-600" />
            <span className="text-sm font-semibold text-rose-700">Personal</span>
          </div>
          <h2 className="page-title">Empleados</h2>
          <p className="text-slate-500 mt-1">Administra empleados y su estado</p>
        </div>

        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo empleado
        </button>
      </div>

      {/* ===== KPIs ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="metric-card card-hover">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">Total</p>
              <p className="stat-value mt-1">{personal.length}</p>
            </div>
            <div className="stat-icon bg-gradient-to-br from-rose-600 to-red-700 shadow-lg shadow-rose-600/15">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="metric-card card-hover">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">Activos</p>
              <p className="stat-value mt-1 text-emerald-700">{activeCount}</p>
            </div>
            <div className="stat-icon bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-lg shadow-emerald-600/15">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="metric-card card-hover">
          <div className="flex items-start justify-between">
            <div>
              <p className="stat-label">Inactivos</p>
              <p className="stat-value mt-1 text-slate-500">{personal.length - activeCount}</p>
            </div>
            <div className="stat-icon bg-gradient-to-br from-slate-500 to-slate-600 shadow-lg shadow-slate-600/10">
              <XCircle className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* ===== Table + Search ===== */}
      <div className="section-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="search-box">
              <Search className="search-box-icon w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar empleados…"
                className="input pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <span className="count-badge">{personal.length} empleados</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner" />
          </div>
        ) : personal.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <User className="w-7 h-7 text-rose-600" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-1">No hay empleados</h3>
            <p className="text-slate-500 mb-5">Comienza agregando tu primer empleado.</p>
            <button onClick={openCreate} className="btn-primary">Agregar empleado</button>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="rounded-tl-xl">Empleado</th>
                  <th>DNI</th>
                  <th>Puesto</th>
                  <th>RD</th>
                  <th>UU</th>
                  <th>Estado</th>
                  <th className="text-right rounded-tr-xl">Acción</th>
                </tr>
              </thead>
              <tbody>
                {personal.map((p) => (
                  <tr key={p.id} className="table-row">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-600 to-red-700 text-white font-extrabold flex items-center justify-center shadow shadow-rose-600/15">
                          {(p.nombres?.charAt(0) || p.apellidos?.charAt(0) || '?').toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-sm truncate">{p.apellidos} {p.nombres}</p>
                          <p className="text-xs text-slate-500 truncate">{p.puesto || '-'}</p>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="font-mono text-xs bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700">{p.dni || '-'}</span>
                    </td>

                    <td>
                      <span className="text-slate-700 text-sm">{p.puesto || '-'}</span>
                    </td>

                    <td>
                      <span className="font-mono text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-lg">{p.rd || '-'}</span>
                    </td>

                    <td>
                      <span className="font-mono text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-lg">{p.uu || '-'}</span>
                    </td>

                    <td>
                      <button
                        onClick={() => toggleActivo(p)}
                        className={[
                          'inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all border',
                          p.activo
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-100 hover:bg-emerald-100'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
                        ].join(' ')}
                        title="Cambiar estado"
                      >
                        {p.activo ? (
                          <>
                            <CheckCircle className="w-4 h-4" /> Activo
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" /> Inactivo
                          </>
                        )}
                      </button>
                    </td>

                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(p)}
                          className="p-2 rounded-xl hover:bg-slate-100 text-slate-700 transition-all"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => requestDelete(p)}
                          className="p-2 rounded-xl hover:bg-rose-50 text-rose-700 transition-all"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== Modal: Create/Edit ===== */}
      {showModal && (
        <Modal
          title={editing ? 'Editar empleado' : 'Nuevo empleado'}
          subtitle={editing ? 'Actualiza los datos del empleado' : 'Completa los datos del empleado'}
          onClose={() => setShowModal(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label text-xs mb-1 flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5 text-rose-600" /> DNI
                </label>
                <input
                  type="text"
                  className="input"
                  value={form.dni}
                  onChange={(e) => setForm({ ...form, dni: e.target.value })}
                  placeholder="12345678"
                  maxLength={8}
                />
              </div>

              <div>
                <label className="label text-xs mb-1 flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-rose-600" /> Puesto
                </label>
                <input
                  type="text"
                  className="input"
                  value={form.puesto}
                  onChange={(e) => setForm({ ...form, puesto: e.target.value })}
                  placeholder="Puesto"
                />
              </div>
            </div>

            <div>
              <label className="label text-xs mb-1 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-rose-600" /> Nombres *
              </label>
              <input
                type="text"
                className={`input ${errors.nombres ? 'form-error' : ''}`}
                value={form.nombres}
                onChange={(e) => {
                  setForm({ ...form, nombres: e.target.value })
                  if (errors.nombres) setErrors({ ...errors, nombres: undefined })
                }}
                placeholder="Nombres"
              />
              {errors.nombres && <p className="error-text">{errors.nombres}</p>}
            </div>

            <div>
              <label className="label text-xs mb-1 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-rose-600" /> Apellidos *
              </label>
              <input
                type="text"
                className={`input ${errors.apellidos ? 'form-error' : ''}`}
                value={form.apellidos}
                onChange={(e) => {
                  setForm({ ...form, apellidos: e.target.value })
                  if (errors.apellidos) setErrors({ ...errors, apellidos: undefined })
                }}
                placeholder="Apellidos"
              />
              {errors.apellidos && <p className="error-text">{errors.apellidos}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label text-xs mb-1 flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-rose-600" /> RD
                </label>
                <input
                  type="text"
                  className="input"
                  value={form.rd}
                  onChange={(e) => setForm({ ...form, rd: e.target.value })}
                  placeholder="RD"
                />
              </div>

              <div>
                <label className="label text-xs mb-1 flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-rose-600" /> UU
                </label>
                <input
                  type="text"
                  className="input"
                  value={form.uu}
                  onChange={(e) => setForm({ ...form, uu: e.target.value })}
                  placeholder="UU"
                />
              </div>
            </div>

            {editing && (
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="activo"
                  checked={form.activo}
                  onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <label htmlFor="activo" className="text-sm font-semibold text-slate-800">
                  Empleado activo
                </label>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
                {editing ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ===== Modal: Confirm delete ===== */}
      {confirmDelete && (
        <Modal
          title="Confirmar eliminación"
          subtitle="Esta acción no se puede deshacer"
          onClose={() => setConfirmDelete(null)}
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50">
              <p className="font-semibold text-rose-800">
                ¿Eliminar a {confirmDelete.label}?
              </p>
              <p className="text-sm text-rose-700 mt-1">
                Se eliminarán también sus registros asociados si existen.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setConfirmDelete(null)} type="button">
                Cancelar
              </button>
              <button className="btn-danger" onClick={doDelete} type="button">
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}