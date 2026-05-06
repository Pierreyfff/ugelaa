import { useEffect, useState } from 'react'
import { planillasApi, personalApi } from '../services/api'
import { Plus, Trash2, X, Eye, FileSpreadsheet, DollarSign, ArrowDownToLine, ArrowUpFromLine, User, Calendar } from 'lucide-react'

interface Personal {
  id: number
  dni: string
  nombres: string
  apellidos: string
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
      setError('Debe seleccionar un empleado')
      return
    }

    try {
      await planillasApi.create(form)
      setShowModal(false)
      setForm({ personal_id: 0, mes: mes, anio: anio })
      loadData()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear planilla')
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('¿Eliminar esta planilla? Esta acción no se puede deshacer.')) {
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Planillas</h2>
          <p className="text-slate-500">Gestión de nóminas mensuales</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" /> Nueva Planilla
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-xl shadow-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Total Haberes</p>
              <p className="text-3xl font-bold">{formatCurrency(totalHaberes)}</p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <ArrowDownToLine className="w-7 h-7" />
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-rose-400 to-red-500 text-white shadow-xl shadow-rose-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Total Descuentos</p>
              <p className="text-3xl font-bold">{formatCurrency(totalDescuentos)}</p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <ArrowUpFromLine className="w-7 h-7" />
            </div>
          </div>
        </div>
        <div className="card bg-gradient-to-br from-sky-400 via-blue-500 to-cyan-500 text-white shadow-xl shadow-sky-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Total Líquido</p>
              <p className="text-3xl font-bold">{formatCurrency(totalLiquido)}</p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <DollarSign className="w-7 h-7" />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-500" />
              <select className="input pl-10 w-44" value={mes} onChange={e => setMes(Number(e.target.value))}>
                {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <select className="input w-32" value={anio} onChange={e => setAnio(Number(e.target.value))}>
              {[2024, 2025, 2026, 2027].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <span className="bg-gradient-to-r from-sky-500 to-blue-500 text-white px-5 py-2 rounded-xl font-bold shadow-lg shadow-sky-500/30">
            {planillas.length} planillas
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin"></div>
          </div>
        ) : planillas.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gradient-to-br from-sky-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileSpreadsheet className="w-8 h-8 text-sky-400" />
            </div>
            <p className="text-slate-500 mb-4">No hay planillas para {MESES[mes-1]} {anio}</p>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              Crear Primera Planilla
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border-2 border-sky-100">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-5 py-4">Empleado</th>
                  <th className="px-5 py-4">DNI</th>
                  <th className="px-5 py-4 text-right">Haberes</th>
                  <th className="px-5 py-4 text-right">Descuentos</th>
                  <th className="px-5 py-4 text-right">Líquido</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100">
                {planillas.map(p => (
                  <tr key={p.id} className="table-row">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="avatar avatar-blue">
                          {p.personal?.nombres?.charAt(0) || '?'}
                        </div>
                        <p className="font-bold text-slate-800">{p.personal?.apellidos} {p.personal?.nombres}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-sm text-slate-500">{p.personal?.dni || '—'}</td>
                    <td className="px-5 py-4 text-right text-emerald-600 font-bold">{formatCurrency(p.total_haberes)}</td>
                    <td className="px-5 py-4 text-right text-rose-600 font-bold">{formatCurrency(p.total_descuentos)}</td>
                    <td className="px-5 py-4 text-right">
                      <span className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-sky-500/30">
                        {formatCurrency(p.total_liquido)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => viewDetail(p.id)} className="btn-icon text-sky-600 hover:bg-sky-50" title="Ver detalles">
                          <Eye className="w-4 h-4" />
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
                    <FileSpreadsheet className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Nueva Planilla</h3>
                    <p className="text-white/70 text-xs">Crea una planilla para un empleado</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white p-2">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-5">
              {error && (
                <div className="p-4 bg-rose-50 border-2 border-rose-200 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center">
                    <X className="w-4 h-4 text-rose-600" />
                  </div>
                  <span className="text-rose-700 font-medium">{error}</span>
                </div>
              )}

              <div>
                <label className="label flex items-center gap-2">
                  <User className="w-4 h-4 text-sky-500" /> Empleado *
                </label>
                <select
                  className="input"
                  value={form.personal_id}
                  onChange={e => setForm({ ...form, personal_id: Number(e.target.value) })}
                  required
                >
                  <option value={0}>Seleccionar empleado...</option>
                  {personal.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.apellidos} {p.nombres} {p.dni ? `(${p.dni})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">Solo muestra empleados activos</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-sky-500" /> Mes *
                  </label>
                  <select className="input" value={form.mes} onChange={e => setForm({ ...form, mes: Number(e.target.value) })}>
                    {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-sky-500" /> Año *
                  </label>
                  <select className="input" value={form.anio} onChange={e => setForm({ ...form, anio: Number(e.target.value) })}>
                    {[2024, 2025, 2026, 2027].map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Crear Planilla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetail && detailPlanilla && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="modal-content max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-sky-100 bg-gradient-to-r from-sky-500 via-blue-500 to-cyan-500 sticky top-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="avatar bg-white/20 text-white">
                    {detailPlanilla.personal?.nombres?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {detailPlanilla.personal?.apellidos} {detailPlanilla.personal?.nombres}
                    </h3>
                    <p className="text-white/80 text-sm">{MESES[detailPlanilla.mes - 1]} {detailPlanilla.anio}</p>
                  </div>
                </div>
                <button onClick={() => setShowDetail(false)} className="text-white/80 hover:text-white p-2">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-5 rounded-2xl border-2 border-emerald-100 text-center">
                  <p className="text-sm text-emerald-600 font-medium mb-1">Total Haberes</p>
                  <p className="text-2xl font-bold text-emerald-700">{formatCurrency(detailPlanilla.total_haberes)}</p>
                </div>
                <div className="bg-gradient-to-br from-rose-50 to-red-50 p-5 rounded-2xl border-2 border-rose-100 text-center">
                  <p className="text-sm text-rose-600 font-medium mb-1">Total Descuentos</p>
                  <p className="text-2xl font-bold text-rose-700">{formatCurrency(detailPlanilla.total_descuentos)}</p>
                </div>
                <div className="bg-gradient-to-br from-sky-50 to-blue-50 p-5 rounded-2xl border-2 border-sky-100 text-center">
                  <p className="text-sm text-sky-600 font-medium mb-1">Líquido</p>
                  <p className="text-2xl font-bold text-sky-700">{formatCurrency(detailPlanilla.total_liquido)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-bold text-emerald-700 flex items-center gap-2">
                    <ArrowDownToLine className="w-5 h-5" /> Ingresos
                  </h4>
                  <div className="space-y-2">
                    {detailPlanilla.ingresos?.length === 0 ? (
                      <p className="text-slate-400 text-sm text-center py-4">No hay ingresos registrados</p>
                    ) : (
                      detailPlanilla.ingresos?.map((i: Ingreso) => (
                        <div key={i.id} className="list-item list-item-income">
                          <span className="text-slate-700 font-medium">{i.tipo}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-emerald-700">{formatCurrency(i.monto)}</span>
                            <button onClick={() => deleteIngreso(i.id)} className="text-rose-400 hover:text-rose-600 p-1">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Concepto"
                      className="flex-1 px-3 py-2 text-sm border-2 border-slate-200 rounded-lg focus:border-sky-400 focus:ring-0"
                      value={ingresoForm.tipo}
                      onChange={e => setIngresoForm({ ...ingresoForm, tipo: e.target.value })}
                    />
                    <input
                      type="number"
                      placeholder="Monto"
                      className="w-24 px-3 py-2 text-sm border-2 border-slate-200 rounded-lg focus:border-sky-400 focus:ring-0"
                      value={ingresoForm.monto}
                      onChange={e => setIngresoForm({ ...ingresoForm, monto: e.target.value })}
                    />
                    <button
                      onClick={addIngreso}
                      disabled={!ingresoForm.tipo || !ingresoForm.monto}
                      className="btn-primary px-4 text-sm disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-rose-700 flex items-center gap-2">
                    <ArrowUpFromLine className="w-5 h-5" /> Descuentos
                  </h4>
                  <div className="space-y-2">
                    {detailPlanilla.descuentos?.length === 0 ? (
                      <p className="text-slate-400 text-sm text-center py-4">No hay descuentos registrados</p>
                    ) : (
                      detailPlanilla.descuentos?.map((d: Descuento) => (
                        <div key={d.id} className="list-item list-item-expense">
                          <span className="text-slate-700 font-medium">{d.tipo}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-rose-700">{formatCurrency(d.monto)}</span>
                            <button onClick={() => deleteDescuento(d.id)} className="text-rose-400 hover:text-rose-600 p-1">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Concepto"
                      className="flex-1 px-3 py-2 text-sm border-2 border-slate-200 rounded-lg focus:border-sky-400 focus:ring-0"
                      value={descuentoForm.tipo}
                      onChange={e => setDescuentoForm({ ...descuentoForm, tipo: e.target.value })}
                    />
                    <input
                      type="number"
                      placeholder="Monto"
                      className="w-24 px-3 py-2 text-sm border-2 border-slate-200 rounded-lg focus:border-sky-400 focus:ring-0"
                      value={descuentoForm.monto}
                      onChange={e => setDescuentoForm({ ...descuentoForm, monto: e.target.value })}
                    />
                    <button
                      onClick={addDescuento}
                      disabled={!descuentoForm.tipo || !descuentoForm.monto}
                      className="btn-primary px-4 text-sm disabled:opacity-50"
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