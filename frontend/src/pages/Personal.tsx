import { useEffect, useState } from 'react'
import { personalApi } from '../services/api'
import { Search, Plus, Pencil, Trash2, X, User, Briefcase, Hash, Building, Tag, CheckCircle, XCircle } from 'lucide-react'

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

export default function Personal() {
  const [personal, setPersonal] = useState<Personal[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Personal | null>(null)
  const [form, setForm] = useState({ dni: '', nombres: '', apellidos: '', puesto: '', rd: '', uu: '', activo: true })
  const [errors, setErrors] = useState<{ nombres?: string; apellidos?: string }>({})

  useEffect(() => {
    loadPersonal()
  }, [search])

  const loadPersonal = () => {
    setLoading(true)
    personalApi.list(search)
      .then(res => setPersonal(res.data))
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
      activo: p.activo
    })
    setShowModal(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('¿Eliminar este empleado?')) {
      await personalApi.delete(id)
      loadPersonal()
    }
  }

  const toggleActivo = async (p: Personal) => {
    await personalApi.update(p.id, { activo: !p.activo })
    loadPersonal()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Personal</h2>
          <p className="text-slate-500">Gestión de empleados registrados</p>
        </div>
        <button
          onClick={() => {
            setEditing(null)
            setForm({ dni: '', nombres: '', apellidos: '', puesto: '', rd: '', uu: '', activo: true })
            setErrors({})
            setShowModal(true)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Nuevo Empleado
        </button>
      </div>

      <div className="card">
        <div className="flex items-center mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sky-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, apellido o DNI..."
              className="input pl-12"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="ml-4 flex items-center gap-2 text-sm">
            <span className="bg-gradient-to-r from-sky-500 to-blue-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-sky-500/30">
              {personal.length} registros
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin"></div>
          </div>
        ) : personal.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gradient-to-br from-sky-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-sky-400" />
            </div>
            <p className="text-slate-500">No hay empleados registrados</p>
            <button onClick={() => setShowModal(true)} className="btn-primary mt-4">
              Agregar Primer Empleado
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border-2 border-sky-100">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-5 py-4">Empleado</th>
                  <th className="px-5 py-4">DNI</th>
                  <th className="px-5 py-4">Puesto</th>
                  <th className="px-5 py-4">RD</th>
                  <th className="px-5 py-4">UU</th>
                  <th className="px-5 py-4">Estado</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100">
                {personal.map(p => (
                  <tr key={p.id} className="table-row">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="avatar avatar-blue">
                          {p.nombres?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{p.apellidos} {p.nombres}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-sm bg-slate-100 px-3 py-1.5 rounded-lg text-slate-600">{p.dni || '—'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-sky-400" />
                        <span className="text-slate-600">{p.puesto || '—'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-sm text-slate-500">{p.rd || '—'}</td>
                    <td className="px-5 py-4 font-mono text-sm text-slate-500">{p.uu || '—'}</td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggleActivo(p)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
                          p.activo
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {p.activo ? <><CheckCircle className="w-4 h-4" /> Activo</> : <><XCircle className="w-4 h-4" /> Inactivo</>}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleEdit(p)} className="btn-icon text-sky-600 hover:bg-sky-50" title="Editar">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="btn-icon text-rose-600 hover:bg-rose-50" title="Eliminar">
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-sky-100 bg-gradient-to-r from-sky-500 via-blue-500 to-cyan-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    {editing ? <Pencil className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-white" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {editing ? 'Editar Empleado' : 'Nuevo Empleado'}
                    </h3>
                    <p className="text-white/70 text-xs">{editing ? 'Actualiza los datos del empleado' : 'Completa los datos del nuevo empleado'}</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white p-2">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label flex items-center gap-2">
                    <Hash className="w-4 h-4 text-sky-500" /> DNI
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={form.dni}
                    onChange={e => setForm({ ...form, dni: e.target.value })}
                    placeholder="12345678"
                    maxLength={8}
                  />
                  <p className="text-xs text-slate-400 mt-1">Opcional - 8 dígitos</p>
                </div>
                <div>
                  <label className="label flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-sky-500" /> Puesto
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={form.puesto}
                    onChange={e => setForm({ ...form, puesto: e.target.value })}
                    placeholder="Analista"
                  />
                </div>
              </div>

              <div>
                <label className="label flex items-center gap-2">
                  <User className="w-4 h-4 text-sky-500" /> Nombres *
                </label>
                <input
                  type="text"
                  className={`input ${errors.nombres ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
                  value={form.nombres}
                  onChange={e => {
                    setForm({ ...form, nombres: e.target.value })
                    if (errors.nombres) setErrors({ ...errors, nombres: undefined })
                  }}
                  placeholder="Juan Carlos"
                  required
                />
                {errors.nombres && <p className="text-rose-500 text-xs mt-1">{errors.nombres}</p>}
              </div>

              <div>
                <label className="label flex items-center gap-2">
                  <User className="w-4 h-4 text-sky-500" /> Apellidos *
                </label>
                <input
                  type="text"
                  className={`input ${errors.apellidos ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
                  value={form.apellidos}
                  onChange={e => {
                    setForm({ ...form, apellidos: e.target.value })
                    if (errors.apellidos) setErrors({ ...errors, apellidos: undefined })
                  }}
                  placeholder="Pérez García"
                  required
                />
                {errors.apellidos && <p className="text-rose-500 text-xs mt-1">{errors.apellidos}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label flex items-center gap-2">
                    <Tag className="w-4 h-4 text-sky-500" /> RD
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={form.rd}
                    onChange={e => setForm({ ...form, rd: e.target.value })}
                    placeholder="Código RD"
                  />
                </div>
                <div>
                  <label className="label flex items-center gap-2">
                    <Building className="w-4 h-4 text-sky-500" /> UU
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={form.uu}
                    onChange={e => setForm({ ...form, uu: e.target.value })}
                    placeholder="Código UU"
                  />
                </div>
              </div>

              {editing && (
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border-2 border-slate-100">
                  <input
                    type="checkbox"
                    id="activo"
                    checked={form.activo}
                    onChange={e => setForm({ ...form, activo: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-300 text-sky-500 focus:ring-sky-500"
                  />
                  <label htmlFor="activo" className="text-sm font-medium text-slate-700">
                    Empleado activo en la empresa
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editing ? 'Actualizar Empleado' : 'Crear Empleado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}