import { useEffect, useMemo, useState } from 'react'
import { planillasApi, personalApi } from '../services/api'
import Modal from '../components/Modal'
import { Select } from '../components/Input'
import Button from '../components/Button'
import {
  Plus,
  Trash2,
  Eye,
  FileSpreadsheet,
  DollarSign,
  ArrowDown,
  ArrowUp,
  Search,
  Download,
} from 'lucide-react'

interface Personal {
  id: number
  dni: string
  nombres: string
  apellidos: string
  puesto?: string
}

interface Planilla {
  id: number
  personal_id: number
  personal: Personal
  mes: number
  anio: number
  total_haberes: number
  total_descuentos: number
  total_liquido: number
}

interface Ingreso {
  id: number
  tipo: string
  monto: number
}

interface Descuento {
  id: number
  tipo: string
  monto: number
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const ANIOS = Array.from({ length: new Date().getFullYear() - 1990 }, (_, i) => 1991 + i).reverse()

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value || 0)
}

export default function Planillas() {
  const [planillas, setPlanillas] = useState<Planilla[]>([])
  const [personal, setPersonal] = useState<Personal[]>([])
  const [loading, setLoading] = useState(true)

  const [mes, setMes] = useState<number>(new Date().getMonth() + 1)
  const [anio, setAnio] = useState<number>(new Date().getFullYear())

  const [search, setSearch] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [detailPlanilla, setDetailPlanilla] = useState<any>(null)

  const [form, setForm] = useState({ personal_id: 0, mes, anio })
  const [ingresoForm, setIngresoForm] = useState({ tipo: '', monto: '' })
  const [descuentoForm, setDescuentoForm] = useState({ tipo: '', monto: '' })

  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ id: number } | null>(null)

  useEffect(() => {
    loadData()
  }, [mes, anio])

  const loadData = () => {
    setLoading(true)
    planillasApi
      .list(mes, anio)
      .then((res) => setPlanillas(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))

    personalApi.list('true').then((res) => setPersonal(res.data)).catch(console.error)
  }

  const planillasFiltradas = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return planillas
    return planillas.filter((p) => {
      const nombre = `${p.personal?.apellidos ?? ''} ${p.personal?.nombres ?? ''}`.toLowerCase()
      const dni = `${p.personal?.dni ?? ''}`.toLowerCase()
      const puesto = `${p.personal?.puesto ?? ''}`.toLowerCase()
      return nombre.includes(q) || dni.includes(q) || puesto.includes(q)
    })
  }, [planillas, search])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.personal_id) {
      setError('Selecciona un empleado')
      return
    }

    try {
      await planillasApi.create(form)
      setShowModal(false)
      setForm({ personal_id: 0, mes, anio })
      loadData()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear')
    }
  }

  const requestDelete = (id: number) => setConfirmDelete({ id })

  const doDelete = async () => {
    if (!confirmDelete) return
    await planillasApi.delete(confirmDelete.id)
    setConfirmDelete(null)
    loadData()
  }

  const viewDetail = async (id: number) => {
    const res = await planillasApi.get(id)
    setDetailPlanilla(res.data)
    setShowDetail(true)
  }

  const refreshDetail = async () => {
    if (!detailPlanilla) return
    const res = await planillasApi.get(detailPlanilla.id)
    setDetailPlanilla(res.data)
  }

  const addIngreso = async () => {
    if (!detailPlanilla || !ingresoForm.tipo || !ingresoForm.monto) return
    const monto = parseFloat(ingresoForm.monto)
    if (isNaN(monto) || monto <= 0) return

    await fetch(`${import.meta.env.VITE_API_URL}/api/ingresos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planilla_id: detailPlanilla.id, tipo: ingresoForm.tipo, monto }),
    })
    await refreshDetail()
    setIngresoForm({ tipo: '', monto: '' })
  }

  const addDescuento = async () => {
    if (!detailPlanilla || !descuentoForm.tipo || !descuentoForm.monto) return
    const monto = parseFloat(descuentoForm.monto)
    if (isNaN(monto) || monto <= 0) return

    await fetch(`${import.meta.env.VITE_API_URL}/api/descuentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planilla_id: detailPlanilla.id, tipo: descuentoForm.tipo, monto }),
    })
    await refreshDetail()
    setDescuentoForm({ tipo: '', monto: '' })
  }

  const deleteIngreso = async (id: number) => {
    await fetch(`${import.meta.env.VITE_API_URL}/api/ingresos/${id}`, { method: 'DELETE' })
    await refreshDetail()
  }

  const deleteDescuento = async (id: number) => {
    await fetch(`${import.meta.env.VITE_API_URL}/api/descuentos/${id}`, { method: 'DELETE' })
    await refreshDetail()
  }

  const totalHaberes = useMemo(() => planillas.reduce((acc, p) => acc + (p.total_haberes || 0), 0), [planillas])
  const totalDescuentos = useMemo(() => planillas.reduce((acc, p) => acc + (p.total_descuentos || 0), 0), [planillas])
  const totalLiquido = useMemo(() => planillas.reduce((acc, p) => acc + (p.total_liquido || 0), 0), [planillas])

  const currentPeriod = `${MESES[mes - 1]} ${anio}`

  const mesOptions = MESES.map((m, i) => ({ value: i + 1, label: m }))
  const anioOptions = ANIOS.map((a) => ({ value: a, label: a.toString() }))
  const personalOptions = [{ value: 0, label: 'Seleccionar empleado...' }, ...personal.map((p) => ({
    value: p.id,
    label: `${p.apellidos} ${p.nombres} ${p.dni ? `(${p.dni})` : ''}`,
  }))]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="page-title">Planillas</h2>
          <p className="text-gray-500 mt-1">Administra las nóminas del periodo</p>
        </div>

        <Button onClick={() => setShowModal(true)} icon={<Plus className="w-4 h-4" />}>
          Nueva Planilla
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Total Haberes</p>
              <p className="text-xs text-gray-400 mt-0.5">{planillas.length} planillas</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <ArrowDown className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600">{formatCurrency(totalHaberes)}</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-all">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Total Descuentos</p>
              <p className="text-xs text-gray-400 mt-0.5">DL20530, AFP, otros</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <ArrowUp className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-red-600">{formatCurrency(totalDescuentos)}</p>
        </div>

        <div className="bg-white rounded-2xl border border-red-200 p-5 ring-2 ring-red-500/10 hover:shadow-lg transition-all">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Pago Líquido</p>
              <p className="text-xs text-gray-400 mt-0.5">Total a pagar</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-gray-900">{formatCurrency(totalLiquido)}</p>
        </div>
      </div>

      {/* Filters + Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1 border border-gray-200">
              <Select
                value={mes}
                onChange={(e) => setMes(Number(e.target.value))}
                options={mesOptions}
                className="py-1.5 px-2 w-32 bg-transparent border-0 text-sm"
              />
              <Select
                value={anio}
                onChange={(e) => setAnio(Number(e.target.value))}
                options={anioOptions}
                className="py-1.5 px-2 w-24 bg-transparent border-0 text-sm"
              />
            </div>

            <span className="count-badge text-xs py-1.5 px-3">{planillasFiltradas.length} regs</span>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                className="input pl-10 w-64"
                placeholder="Buscar empleado, DNI..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <Button variant="secondary" icon={<Download className="w-4 h-4" />}>
            Exportar
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner" />
          </div>
        ) : planillasFiltradas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FileSpreadsheet className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Sin planillas</h3>
            <p className="text-gray-500 mb-5">No hay planillas registradas para {currentPeriod}</p>
            <Button onClick={() => setShowModal(true)}>Crear planilla</Button>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>DNI</th>
                  <th className="text-right">Haberes</th>
                  <th className="text-right">Descuentos</th>
                  <th className="text-right">Líquido</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {planillasFiltradas.map((p) => (
                  <tr key={p.id} className="table-row">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          {(p.personal?.nombres?.charAt(0) || p.personal?.apellidos?.charAt(0) || '?').toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">
                            {p.personal?.apellidos} {p.personal?.nombres}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{p.personal?.puesto || '-'}</p>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="font-mono text-xs bg-gray-100 px-2.5 py-1 rounded-lg text-gray-700">
                        {p.personal?.dni || '-'}
                      </span>
                    </td>

                    <td className="text-right">
                      <span className="font-semibold text-emerald-600">{formatCurrency(p.total_haberes)}</span>
                    </td>

                    <td className="text-right">
                      <span className="font-semibold text-red-600">{formatCurrency(p.total_descuentos)}</span>
                    </td>

                    <td className="text-right">
                      <span className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-bold text-xs">
                        {formatCurrency(p.total_liquido)}
                      </span>
                    </td>

                    <td>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => viewDetail(p.id)}
                          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-all"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => requestDelete(p.id)}
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

      {/* Modal Nueva Planilla */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nueva planilla"
        subtitle="Selecciona empleado y periodo"
        maxWidth="md"
      >
        {error && (
          <div className="alert-error mb-4">
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-5">
          <Select
            label="Empleado *"
            value={form.personal_id}
            onChange={(e) => setForm({ ...form, personal_id: Number(e.target.value) })}
            options={personalOptions}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Mes *"
              value={form.mes}
              onChange={(e) => setForm({ ...form, mes: Number(e.target.value) })}
              options={mesOptions}
            />

            <Select
              label="Año *"
              value={form.anio}
              onChange={(e) => setForm({ ...form, anio: Number(e.target.value) })}
              options={anioOptions}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Crear planilla
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Detalle */}
      {showDetail && detailPlanilla && (
        <Modal
          isOpen={showDetail}
          onClose={() => setShowDetail(false)}
          title={`${detailPlanilla.personal?.apellidos ?? ''} ${detailPlanilla.personal?.nombres ?? ''}`.trim() || 'Detalle de planilla'}
          subtitle={`${detailPlanilla.personal?.puesto || '-'} • ${MESES[detailPlanilla.mes - 1]} ${detailPlanilla.anio}`}
          maxWidth="4xl"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Haberes</p>
                  <p className="text-xs text-gray-400">Total ingresos</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <ArrowDown className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
              <p className="text-xl font-extrabold text-emerald-600">{formatCurrency(detailPlanilla.total_haberes)}</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Descuentos</p>
                  <p className="text-xs text-gray-400">Total deducciones</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <ArrowUp className="w-4 h-4 text-red-600" />
                </div>
              </div>
              <p className="text-xl font-extrabold text-red-600">{formatCurrency(detailPlanilla.total_descuentos)}</p>
            </div>

            <div className="bg-white rounded-xl border border-red-200 p-4 ring-2 ring-red-500/10">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase">Líquido</p>
                  <p className="text-xs text-gray-400">Pago neto</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className="text-xl font-extrabold text-gray-900">{formatCurrency(detailPlanilla.total_liquido)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Ingresos */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ArrowDown className="w-4 h-4 text-emerald-600" />
                Ingresos
              </h4>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {(detailPlanilla.ingresos?.length ?? 0) === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-6">Sin ingresos</p>
                ) : (
                  detailPlanilla.ingresos?.map((i: Ingreso) => (
                    <div key={i.id} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                      <span className="text-gray-800 text-sm">{i.tipo}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-700 text-sm">{formatCurrency(i.monto)}</span>
                        <button onClick={() => deleteIngreso(i.id)} className="p-1 rounded hover:bg-emerald-100 text-emerald-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Concepto"
                    className="input flex-1"
                    value={ingresoForm.tipo}
                    onChange={(e) => setIngresoForm({ ...ingresoForm, tipo: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="Monto"
                    className="input w-32"
                    value={ingresoForm.monto}
                    onChange={(e) => setIngresoForm({ ...ingresoForm, monto: e.target.value })}
                  />
                  <Button onClick={addIngreso} disabled={!ingresoForm.tipo || !ingresoForm.monto} size="sm">
                    +
                  </Button>
                </div>
              </div>
            </div>

            {/* Descuentos */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ArrowUp className="w-4 h-4 text-red-600" />
                Descuentos
              </h4>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {(detailPlanilla.descuentos?.length ?? 0) === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-6">Sin descuentos</p>
                ) : (
                  detailPlanilla.descuentos?.map((d: Descuento) => (
                    <div key={d.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                      <span className="text-gray-800 text-sm">{d.tipo}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-red-700 text-sm">{formatCurrency(d.monto)}</span>
                        <button onClick={() => deleteDescuento(d.id)} className="p-1 rounded hover:bg-red-100 text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Concepto"
                    className="input flex-1"
                    value={descuentoForm.tipo}
                    onChange={(e) => setDescuentoForm({ ...descuentoForm, tipo: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="Monto"
                    className="input w-32"
                    value={descuentoForm.monto}
                    onChange={(e) => setDescuentoForm({ ...descuentoForm, monto: e.target.value })}
                  />
                  <Button onClick={addDescuento} disabled={!descuentoForm.tipo || !descuentoForm.monto} size="sm" variant="danger">
                    +
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

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
            <p className="font-semibold text-red-800">¿Eliminar esta planilla?</p>
            <p className="text-sm text-red-700 mt-1">
              Se eliminarán también los ingresos y descuentos asociados.
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