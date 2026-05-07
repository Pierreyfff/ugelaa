import { useEffect, useState } from 'react'
import { planillasApi, personalApi } from '../services/api'
import { Plus, Trash2, X, Eye, FileSpreadsheet, DollarSign, ArrowDownToLine, ArrowUpFromLine, User, Calendar, Filter, Download } from 'lucide-react'

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

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const ANIOS = Array.from({ length: new Date().getFullYear() - 1990 }, (_, i) => 1991 + i).reverse()

export default function Planillas() {
  const [planillas, setPlanillas] = useState<Planilla[]>([])
  const [personal, setPersonal] = useState<Personal[]>([])
  const [loading, setLoading] = useState(true)
  const [mes, setMes] = useState<number>(new Date().getMonth() + 1)
  const [anio, setAnio] = useState<number>(new Date().getFullYear())
  const [showModal, setShowModal] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [detailPlanilla, setDetailPlanilla] = useState<any>(null)
  const [form, setForm] = useState({ personal_id: 0, mes: mes, anio: anio })
  const [ingresoForm, setIngresoForm] = useState({ tipo: '', monto: '' })
  const [descuentoForm, setDescuentoForm] = useState({ tipo: '', monto: '' })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [mes, anio])

  const loadData = () => {
    setLoading(true)
    planillasApi.list(mes, anio)
      .then(res => setPlanillas(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))

    personalApi.list('true').then(res => setPersonal(res.data)).catch(console.error)
  }

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

  const handleDelete = async (id: number) => {
    if (confirm('¿Eliminar esta planilla?')) {
      await planillasApi.delete(id)
      loadData()
    }
  }

  const viewDetail = async (id: number) => {
    const res = await planillasApi.get(id)
    setDetailPlanilla(res.data)
    setShowDetail(true)
  }

  const addIngreso = async () => {
    if (!detailPlanilla || !ingresoForm.tipo || !ingresoForm.monto) return
    const monto = parseFloat(ingresoForm.monto)
    if (isNaN(monto) || monto <= 0) return

    await fetch(`${import.meta.env.VITE_API_URL}/api/ingresos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planilla_id: detailPlanilla.id, tipo: ingresoForm.tipo, monto })
    })
    const res = await planillasApi.get(detailPlanilla.id)
    setDetailPlanilla(res.data)
    setIngresoForm({ tipo: '', monto: '' })
  }

  const addDescuento = async () => {
    if (!detailPlanilla || !descuentoForm.tipo || !descuentoForm.monto) return
    const monto = parseFloat(descuentoForm.monto)
    if (isNaN(monto) || monto <= 0) return

    await fetch(`${import.meta.env.VITE_API_URL}/api/descuentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planilla_id: detailPlanilla.id, tipo: descuentoForm.tipo, monto })
    })
    const res = await planillasApi.get(detailPlanilla.id)
    setDetailPlanilla(res.data)
    setDescuentoForm({ tipo: '', monto: '' })
  }

  const deleteIngreso = async (id: number) => {
    await fetch(`${import.meta.env.VITE_API_URL}/api/ingresos/${id}`, { method: 'DELETE' })
    const res = await planillasApi.get(detailPlanilla.id)
    setDetailPlanilla(res.data)
  }

  const deleteDescuento = async (id: number) => {
    await fetch(`${import.meta.env.VITE_API_URL}/api/descuentos/${id}`, { method: 'DELETE' })
    const res = await planillasApi.get(detailPlanilla.id)
    setDetailPlanilla(res.data)
  }

  const totalHaberes = planillas.reduce((acc, p) => acc + p.total_haberes, 0)
  const totalDescuentos = planillas.reduce((acc, p) => acc + p.total_descuentos, 0)
  const totalLiquido = planillas.reduce((acc, p) => acc + p.total_liquido, 0)

  const currentPeriod = `${MESES[mes - 1]} ${anio}`

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileSpreadsheet className="w-5 h-5 text-cyan-500" />
            <span className="text-sm font-medium text-cyan-600">Gestión de Nóminas</span>
          </div>
          <h2 className="page-title">Planillas</h2>
          <p className="text-slate-500 mt-1">Administra las nóminas de tu personal</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nueva Planilla
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/20">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">Total Haberes</span>
              <div className="p-2 bg-white/20 rounded-xl">
                <ArrowDownToLine className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold tracking-tight">{formatCurrency(totalHaberes)}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-1 bg-white/20 rounded-lg text-xs font-medium">
                {planillas.length} planillas
              </span>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-rose-500 via-red-500 to-orange-500 rounded-2xl p-5 text-white shadow-lg shadow-rose-500/20">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-rose-100 text-xs font-semibold uppercase tracking-wider">Total Descuentos</span>
              <div className="p-2 bg-white/20 rounded-xl">
                <ArrowUpFromLine className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold tracking-tight">{formatCurrency(totalDescuentos)}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-1 bg-white/20 rounded-lg text-xs font-medium">
                DL20530, AFP, Otros
              </span>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/20">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <span className="text-cyan-100 text-xs font-semibold uppercase tracking-wider">Pago Líquido</span>
              <div className="p-2 bg-white/20 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold tracking-tight">{formatCurrency(totalLiquido)}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-1 bg-white/20 rounded-lg text-xs font-medium">
                Total a pagar
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1">
              <select 
                className="input py-1.5 px-2 w-28 bg-transparent border-0 text-sm" 
                value={mes} 
                onChange={e => setMes(Number(e.target.value))}
              >
                {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select 
                className="input py-1.5 px-2 w-20 bg-transparent border-0 text-sm" 
                value={anio} 
                onChange={e => setAnio(Number(e.target.value))}
              >
                {ANIOS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <span className="count-badge text-xs py-1.5 px-3">{planillas.length} regs</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary flex items-center gap-2 py-2.5 px-4">
              <Filter className="w-4 h-4" /> Filtrar
            </button>
            <button className="btn-secondary flex items-center gap-2 py-2.5 px-4">
              <Download className="w-4 h-4" /> Exportar
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner"></div>
          </div>
        ) : planillas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FileSpreadsheet className="w-7 h-7 text-cyan-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Sin planillas</h3>
            <p className="text-slate-500 mb-5">No hay planillas registradas para {currentPeriod}</p>
            <button onClick={() => setShowModal(true)} className="btn-primary">Crear Planilla</button>
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
                {planillas.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="avatar avatar-blue">
                          {p.personal?.nombres?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 text-xs">{p.personal?.apellidos} {p.personal?.nombres}</p>
                          <p className="text-[10px] text-slate-500">{p.personal?.puesto || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">{p.personal?.dni || '-'}</span>
                    </td>
                    <td className="text-right">
                      <span className="font-medium text-emerald-600 text-xs">{formatCurrency(p.total_haberes)}</span>
                    </td>
                    <td className="text-right">
                      <span className="font-medium text-red-500 text-xs">{formatCurrency(p.total_descuentos)}</span>
                    </td>
                    <td className="text-right">
                      <span className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-semibold text-xs">
                        {formatCurrency(p.total_liquido)}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => viewDetail(p.id)} 
                          className="p-1.5 rounded-lg hover:bg-cyan-50 text-cyan-600 transition-all" 
                          title="Ver detalles"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id)} 
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-all" 
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
            <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-cyan-500 to-blue-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Nueva Planilla</h3>
                    <p className="text-white/70 text-xs">Selecciona el empleado</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-5">
              {error && (
                <div className="alert-error">
                  <X className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div>
                <label className="label flex items-center gap-2">
                  <User className="w-4 h-4 text-cyan-500" /> Empleado *
                </label>
                <select
                  className="input"
                  value={form.personal_id}
                  onChange={e => setForm({ ...form, personal_id: Number(e.target.value) })}
                >
                  <option value={0}>Seleccionar empleado...</option>
                  {personal.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.apellidos} {p.nombres} {p.dni ? `(${p.dni})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-grid form-grid-2">
                <div>
                  <label className="label flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-cyan-500" /> Mes *
                  </label>
                  <select className="input" value={form.mes} onChange={e => setForm({ ...form, mes: Number(e.target.value) })}>
                    {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-cyan-500" /> Año *
                  </label>
                  <select className="input" value={form.anio} onChange={e => setForm({ ...form, anio: Number(e.target.value) })}>
                    {ANIOS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">Crear Planilla</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetail && detailPlanilla && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="modal-content w-[95vw] max-w-4xl max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-4 py-3 bg-gradient-to-r from-slate-800 to-slate-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                    {detailPlanilla.personal?.nombres?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {detailPlanilla.personal?.apellidos} {detailPlanilla.personal?.nombres}
                    </h3>
                    <p className="text-slate-400 text-xs">{detailPlanilla.personal?.puesto || '-'} | {MESES[detailPlanilla.mes - 1]} {detailPlanilla.anio}</p>
                  </div>
                </div>
                <button onClick={() => setShowDetail(false)} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl p-3 text-white">
                  <p className="text-emerald-100 text-[10px] uppercase font-semibold">Haberes</p>
                  <p className="text-lg font-bold">{formatCurrency(detailPlanilla.total_haberes)}</p>
                </div>
                <div className="bg-gradient-to-br from-rose-400 to-red-600 rounded-xl p-3 text-white">
                  <p className="text-rose-100 text-[10px] uppercase font-semibold">Descuentos</p>
                  <p className="text-lg font-bold">{formatCurrency(detailPlanilla.total_descuentos)}</p>
                </div>
                <div className="bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl p-3 text-white">
                  <p className="text-cyan-100 text-[10px] uppercase font-semibold">Líquido</p>
                  <p className="text-lg font-bold">{formatCurrency(detailPlanilla.total_liquido)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                  <h4 className="font-bold text-emerald-600 text-xs flex items-center gap-1 mb-3 pb-2 border-b border-emerald-100">
                    <ArrowDownToLine className="w-3 h-3" /> Ingresos
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {detailPlanilla.ingresos?.length === 0 ? (
                      <p className="text-slate-400 text-xs text-center py-4">Sin ingresos</p>
                    ) : (
                      detailPlanilla.ingresos?.map((i: Ingreso) => (
                        <div key={i.id} className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                          <span className="text-slate-700 text-xs">{i.tipo}</span>
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-emerald-700 text-xs">{formatCurrency(i.monto)}</span>
                            <button onClick={() => deleteIngreso(i.id)} className="p-1 rounded hover:bg-red-100 text-red-400">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-1 mt-2 pt-2 border-t border-slate-100">
                    <input
                      type="text"
                      placeholder="Concepto"
                      className="input text-xs py-1 flex-1"
                      value={ingresoForm.tipo}
                      onChange={e => setIngresoForm({ ...ingresoForm, tipo: e.target.value })}
                    />
                    <input
                      type="number"
                      placeholder="S/"
                      className="input text-xs py-1 w-16"
                      value={ingresoForm.monto}
                      onChange={e => setIngresoForm({ ...ingresoForm, monto: e.target.value })}
                    />
                    <button
                      onClick={addIngreso}
                      disabled={!ingresoForm.tipo || !ingresoForm.monto}
                      className="px-2 bg-emerald-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                  <h4 className="font-bold text-red-600 text-xs flex items-center gap-1 mb-3 pb-2 border-b border-red-100">
                    <ArrowUpFromLine className="w-3 h-3" /> Descuentos
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {detailPlanilla.descuentos?.length === 0 ? (
                      <p className="text-slate-400 text-xs text-center py-4">Sin descuentos</p>
                    ) : (
                      detailPlanilla.descuentos?.map((d: Descuento) => (
                        <div key={d.id} className="flex items-center justify-between p-2 bg-red-50 rounded-lg border border-red-100">
                          <span className="text-slate-700 text-xs">{d.tipo}</span>
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-red-700 text-xs">{formatCurrency(d.monto)}</span>
                            <button onClick={() => deleteDescuento(d.id)} className="p-1 rounded hover:bg-red-200 text-red-400">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-1 mt-2 pt-2 border-t border-slate-100">
                    <input
                      type="text"
                      placeholder="Concepto"
                      className="input text-xs py-1 flex-1"
                      value={descuentoForm.tipo}
                      onChange={e => setDescuentoForm({ ...descuentoForm, tipo: e.target.value })}
                    />
                    <input
                      type="number"
                      placeholder="S/"
                      className="input text-xs py-1 w-16"
                      value={descuentoForm.monto}
                      onChange={e => setDescuentoForm({ ...descuentoForm, monto: e.target.value })}
                    />
                    <button
                      onClick={addDescuento}
                      disabled={!descuentoForm.tipo || !descuentoForm.monto}
                      className="px-2 bg-red-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}