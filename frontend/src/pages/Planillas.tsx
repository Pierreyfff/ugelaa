import { useEffect, useMemo, useState } from 'react'
import { planillasApi, personalApi } from '../services/api'
import {
  Plus,
  Trash2,
  X,
  Eye,
  FileSpreadsheet,
  DollarSign,
  ArrowDownToLine,
  ArrowUpFromLine,
  User,
  Calendar,
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

/** Modal simple (reutilizable localmente para no crear más archivos aún) */
function Modal({
  title,
  subtitle,
  onClose,
  children,
  maxWidthClass = 'max-w-4xl',
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mes, anio])

  const loadData = () => {
    setLoading(true)
    planillasApi
      .list(mes, anio)
      .then((res) => setPlanillas(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))

    // (tu API usa search, por ahora mantenemos como estaba)
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

  return (
    <div className="space-y-6">
      {/* ===== Header ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileSpreadsheet className="w-5 h-5 text-rose-600" />
            <span className="text-sm font-semibold text-rose-700">Planillas</span>
          </div>
          <h2 className="page-title">Planilla mensual</h2>
          <p className="text-slate-500 mt-1">Revisa y administra nóminas del periodo</p>
        </div>

        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nueva planilla
        </button>
      </div>

      {/* ===== KPI cards ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="metric-card card-hover">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="stat-label">Total haberes</p>
              <p className="text-xs text-slate-400 mt-0.5">{planillas.length} planillas</p>
            </div>
            <div className="stat-icon bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-lg shadow-emerald-600/15">
              <ArrowDownToLine className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="stat-value text-emerald-700">{formatCurrency(totalHaberes)}</p>
        </div>

        <div className="metric-card card-hover">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="stat-label">Total descuentos</p>
              <p className="text-xs text-slate-400 mt-0.5">DL20530, AFP, otros</p>
            </div>
            <div className="stat-icon bg-gradient-to-br from-rose-600 to-red-700 shadow-lg shadow-rose-600/15">
              <ArrowUpFromLine className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="stat-value text-rose-700">{formatCurrency(totalDescuentos)}</p>
        </div>

        <div className="metric-card card-hover ring-2 ring-rose-600/25">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="stat-label">Pago líquido</p>
              <p className="text-xs text-slate-400 mt-0.5">Total a pagar</p>
            </div>
            <div className="stat-icon bg-gradient-to-br from-rose-600 to-red-700 shadow-lg shadow-rose-600/15">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
          </div>
          <p className="stat-value">{formatCurrency(totalLiquido)}</p>
        </div>
      </div>

      {/* ===== Filters + Table ===== */}
      <div className="section-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-1 border border-slate-200">
              <select
                className="input py-1.5 px-2 w-32 bg-transparent border-0 text-sm"
                value={mes}
                onChange={(e) => setMes(Number(e.target.value))}
              >
                {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select
                className="input py-1.5 px-2 w-24 bg-transparent border-0 text-sm"
                value={anio}
                onChange={(e) => setAnio(Number(e.target.value))}
              >
                {ANIOS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <span className="count-badge text-xs py-1.5 px-3">{planillasFiltradas.length} regs</span>

            <div className="search-box">
              <Search className="w-4 h-4 search-box-icon" />
              <input
                className="input"
                placeholder="Buscar empleado, DNI o puesto…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="btn-secondary flex items-center gap-2 py-2.5 px-4" type="button">
              <Download className="w-4 h-4" /> Exportar
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner" />
          </div>
        ) : planillasFiltradas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FileSpreadsheet className="w-7 h-7 text-rose-600" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-1">Sin planillas</h3>
            <p className="text-slate-500 mb-5">No hay planillas registradas para {currentPeriod}</p>
            <button onClick={() => setShowModal(true)} className="btn-primary">Crear planilla</button>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="rounded-tl-xl">Empleado</th>
                  <th>DNI</th>
                  <th className="text-right">Haberes</th>
                  <th className="text-right">Descuentos</th>
                  <th className="text-right">Líquido</th>
                  <th className="text-center rounded-tr-xl">Acción</th>
                </tr>
              </thead>
              <tbody>
                {planillasFiltradas.map((p) => (
                  <tr key={p.id} className="table-row">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-600 to-red-700 text-white font-extrabold flex items-center justify-center shadow shadow-rose-600/15">
                          {(p.personal?.nombres?.charAt(0) || p.personal?.apellidos?.charAt(0) || '?').toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-sm truncate">
                            {p.personal?.apellidos} {p.personal?.nombres}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{p.personal?.puesto || '-'}</p>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="font-mono text-xs bg-slate-100 px-2.5 py-1 rounded-lg text-slate-700">
                        {p.personal?.dni || '-'}
                      </span>
                    </td>

                    <td className="text-right">
                      <span className="font-semibold text-emerald-700">{formatCurrency(p.total_haberes)}</span>
                    </td>

                    <td className="text-right">
                      <span className="font-semibold text-rose-700">{formatCurrency(p.total_descuentos)}</span>
                    </td>

                    <td className="text-right">
                      <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-rose-600 to-red-700 text-white rounded-xl font-extrabold text-xs shadow-md shadow-rose-600/15">
                        {formatCurrency(p.total_liquido)}
                      </span>
                    </td>

                    <td>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => viewDetail(p.id)}
                          className="p-2 rounded-xl hover:bg-slate-100 text-slate-700 transition-all"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => requestDelete(p.id)}
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

      {/* ===== Modal: Nueva planilla ===== */}
      {showModal && (
        <Modal
          title="Nueva planilla"
          subtitle="Selecciona empleado y periodo"
          onClose={() => setShowModal(false)}
          maxWidthClass="max-w-xl"
        >
          {error && (
            <div className="alert-error mb-4">
              <X className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-5">
            <div>
              <label className="label flex items-center gap-2">
                <User className="w-4 h-4 text-rose-600" /> Empleado *
              </label>
              <select
                className="input"
                value={form.personal_id}
                onChange={(e) => setForm({ ...form, personal_id: Number(e.target.value) })}
              >
                <option value={0}>Seleccionar empleado…</option>
                {personal.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.apellidos} {p.nombres} {p.dni ? `(${p.dni})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-grid form-grid-2">
              <div>
                <label className="label flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-rose-600" /> Mes *
                </label>
                <select
                  className="input"
                  value={form.mes}
                  onChange={(e) => setForm({ ...form, mes: Number(e.target.value) })}
                >
                  {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>

              <div>
                <label className="label flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-rose-600" /> Año *
                </label>
                <select
                  className="input"
                  value={form.anio}
                  onChange={(e) => setForm({ ...form, anio: Number(e.target.value) })}
                >
                  {ANIOS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
                Crear planilla
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ===== Modal: Detalle ===== */}
      {showDetail && detailPlanilla && (
        <Modal
          title={`${detailPlanilla.personal?.apellidos ?? ''} ${detailPlanilla.personal?.nombres ?? ''}`.trim() || 'Detalle de planilla'}
          subtitle={`${detailPlanilla.personal?.puesto || '-'} • ${MESES[detailPlanilla.mes - 1]} ${detailPlanilla.anio}`}
          onClose={() => setShowDetail(false)}
          maxWidthClass="max-w-6xl"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
            <div className="metric-card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="stat-label">Haberes</p>
                  <p className="text-xs text-slate-400 mt-0.5">Total ingresos</p>
                </div>
                <div className="stat-icon bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-lg shadow-emerald-600/15">
                  <ArrowDownToLine className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="stat-value text-emerald-700">{formatCurrency(detailPlanilla.total_haberes)}</p>
            </div>

            <div className="metric-card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="stat-label">Descuentos</p>
                  <p className="text-xs text-slate-400 mt-0.5">Total deducciones</p>
                </div>
                <div className="stat-icon bg-gradient-to-br from-rose-600 to-red-700 shadow-lg shadow-rose-600/15">
                  <ArrowUpFromLine className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="stat-value text-rose-700">{formatCurrency(detailPlanilla.total_descuentos)}</p>
            </div>

            <div className="metric-card ring-2 ring-rose-600/25">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="stat-label">Líquido</p>
                  <p className="text-xs text-slate-400 mt-0.5">Pago neto</p>
                </div>
                <div className="stat-icon bg-gradient-to-br from-rose-600 to-red-700 shadow-lg shadow-rose-600/15">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="stat-value">{formatCurrency(detailPlanilla.total_liquido)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Ingresos */}
            <div className="section-card p-4">
              <h4 className="font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                <ArrowDownToLine className="w-4 h-4 text-emerald-700" />
                Ingresos
              </h4>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {(detailPlanilla.ingresos?.length ?? 0) === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-8">Sin ingresos</p>
                ) : (
                  detailPlanilla.ingresos?.map((i: Ingreso) => (
                    <div key={i.id} className="flex items-center justify-between p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <span className="text-slate-800 text-sm">{i.tipo}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-emerald-800 text-sm">{formatCurrency(i.monto)}</span>
                        <button onClick={() => deleteIngreso(i.id)} className="p-2 rounded-xl hover:bg-rose-100 text-rose-700" title="Eliminar">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Concepto"
                    className="input"
                    value={ingresoForm.tipo}
                    onChange={(e) => setIngresoForm({ ...ingresoForm, tipo: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="Monto"
                    className="input sm:w-40"
                    value={ingresoForm.monto}
                    onChange={(e) => setIngresoForm({ ...ingresoForm, monto: e.target.value })}
                  />
                  <button
                    onClick={addIngreso}
                    disabled={!ingresoForm.tipo || !ingresoForm.monto}
                    className="btn-primary disabled:opacity-50"
                    type="button"
                  >
                    + Agregar
                  </button>
                </div>
              </div>
            </div>

            {/* Descuentos */}
            <div className="section-card p-4">
              <h4 className="font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                <ArrowUpFromLine className="w-4 h-4 text-rose-700" />
                Descuentos
              </h4>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {(detailPlanilla.descuentos?.length ?? 0) === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-8">Sin descuentos</p>
                ) : (
                  detailPlanilla.descuentos?.map((d: Descuento) => (
                    <div key={d.id} className="flex items-center justify-between p-3 bg-rose-50 rounded-2xl border border-rose-100">
                      <span className="text-slate-800 text-sm">{d.tipo}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-rose-800 text-sm">{formatCurrency(d.monto)}</span>
                        <button onClick={() => deleteDescuento(d.id)} className="p-2 rounded-xl hover:bg-rose-100 text-rose-700" title="Eliminar">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Concepto"
                    className="input"
                    value={descuentoForm.tipo}
                    onChange={(e) => setDescuentoForm({ ...descuentoForm, tipo: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="Monto"
                    className="input sm:w-40"
                    value={descuentoForm.monto}
                    onChange={(e) => setDescuentoForm({ ...descuentoForm, monto: e.target.value })}
                  />
                  <button
                    onClick={addDescuento}
                    disabled={!descuentoForm.tipo || !descuentoForm.monto}
                    className="btn-danger disabled:opacity-50"
                    type="button"
                  >
                    + Agregar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ===== Modal: Confirm delete ===== */}
      {confirmDelete && (
        <Modal
          title="Confirmar eliminación"
          subtitle="Esta acción no se puede deshacer"
          onClose={() => setConfirmDelete(null)}
          maxWidthClass="max-w-xl"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50">
              <p className="font-semibold text-rose-800">¿Eliminar esta planilla?</p>
              <p className="text-sm text-rose-700 mt-1">
                Se eliminarán también los ingresos y descuentos asociados.
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