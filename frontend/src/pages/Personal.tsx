import { useEffect, useMemo, useState } from 'react'
import { personalApi } from '../services/api'
import Modal from '../components/Modal'
import { Input, Select } from '../components/Input'
import Button from '../components/Button'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  User,
  CheckCircle,
  XCircle,
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

  const puestoOptions = [
    { value: '', label: 'Sin puesto' },
    { value: 'Profesor', label: 'Profesor' },
    { value: 'Director', label: 'Director' },
    { value: 'Subdirector', label: 'Subdirector' },
    { value: 'Secretario', label: 'Secretario' },
    { value: 'Auxiliar', label: 'Auxiliar' },
    { value: 'Administrativo', label: 'Administrativo' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="page-title">Personal</h2>
          <p className="text-gray-500 mt-1">Administra los empleados registrados</p>
        </div>

        <Button onClick={openCreate} icon={<Plus className="w-4 h-4" />}>
          Nuevo Empleado
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Total</p>
              <p className="text-2xl font-extrabold text-gray-900 mt-1">{personal.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <User className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Activos</p>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">{activeCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Inactivos</p>
              <p className="text-2xl font-extrabold text-gray-400 mt-1">{personal.length - activeCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                className="input pl-10 w-64"
                placeholder="Buscar empleados..."
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
              <User className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No hay empleados</h3>
            <p className="text-gray-500 mb-5">Comienza agregando tu primer empleado.</p>
            <Button onClick={openCreate}>Agregar empleado</Button>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>DNI</th>
                  <th>Puesto</th>
                  <th>RD</th>
                  <th>UU</th>
                  <th>Estado</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {personal.map((p) => (
                  <tr key={p.id} className="table-row">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          {(p.nombres?.charAt(0) || p.apellidos?.charAt(0) || '?').toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{p.apellidos} {p.nombres}</p>
                          <p className="text-xs text-gray-500 truncate">{p.puesto || '-'}</p>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="font-mono text-xs bg-gray-100 px-2.5 py-1 rounded-lg text-gray-700">{p.dni || '-'}</span>
                    </td>

                    <td>
                      <span className="text-gray-700 text-sm">{p.puesto || '-'}</span>
                    </td>

                    <td>
                      <span className="font-mono text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-lg">{p.rd || '-'}</span>
                    </td>

                    <td>
                      <span className="font-mono text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-lg">{p.uu || '-'}</span>
                    </td>

                    <td>
                      <button
                        onClick={() => toggleActivo(p)}
                        className={[
                          'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                          p.activo
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100',
                        ].join(' ')}
                      >
                        {p.activo ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" /> Activo
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" /> Inactivo
                          </>
                        )}
                      </button>
                    </td>

                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(p)}
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-all"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => requestDelete(p)}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-all"
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

      {/* Modal Create/Edit */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Editar empleado' : 'Nuevo empleado'}
        subtitle={editing ? 'Actualiza los datos del empleado' : 'Completa los datos del empleado'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="DNI"
              value={form.dni}
              onChange={(e) => setForm({ ...form, dni: e.target.value })}
              placeholder="12345678"
              maxLength={8}
            />

            <Select
              label="Puesto"
              value={form.puesto}
              onChange={(e) => setForm({ ...form, puesto: e.target.value })}
              options={puestoOptions}
            />
          </div>

          <Input
            label="Nombres *"
            value={form.nombres}
            onChange={(e) => {
              setForm({ ...form, nombres: e.target.value })
              if (errors.nombres) setErrors({ ...errors, nombres: undefined })
            }}
            placeholder="Nombres completos"
            error={errors.nombres}
          />

          <Input
            label="Apellidos *"
            value={form.apellidos}
            onChange={(e) => {
              setForm({ ...form, apellidos: e.target.value })
              if (errors.apellidos) setErrors({ ...errors, apellidos: undefined })
            }}
            placeholder="Apellidos completos"
            error={errors.apellidos}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="RD"
              value={form.rd}
              onChange={(e) => setForm({ ...form, rd: e.target.value })}
              placeholder="RD"
            />

            <Input
              label="UU"
              value={form.uu}
              onChange={(e) => setForm({ ...form, uu: e.target.value })}
              placeholder="UU"
            />
          </div>

          {editing && (
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <input
                type="checkbox"
                id="activo"
                checked={form.activo}
                onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <label htmlFor="activo" className="text-sm font-medium text-gray-700">
                Empleado activo
              </label>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {editing ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Confirm Delete */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Confirmar eliminación"
        subtitle="Esta acción no se puede deshacer"
        maxWidth="sm"
      >
        <div className="space-y-5">
          <div className="p-4 rounded-xl border border-red-200 bg-red-50">
            <p className="font-semibold text-red-800">¿Eliminar a {confirmDelete?.label}?</p>
            <p className="text-sm text-red-700 mt-1">
              Se eliminarán también sus registros asociados si existen.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={doDelete} icon={<Trash2 className="w-4 h-4" />}>
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}