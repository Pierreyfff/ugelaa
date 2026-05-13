import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { dashboardApi } from '../services/api'
import {
  Users,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  ArrowRight,
  Activity,
  Clock,
  CheckCircle2,
  Search,
  ListChecks,
} from 'lucide-react'

interface Resumen {
  total_personal: number
  total_planillas: number
  total_haberes: number
  total_descuentos: number
  total_liquido: number
  planillas_mes: any[]
}

type StatConfigItem = {
  label: string
  key: keyof Pick<
    Resumen,
    'total_personal' | 'total_planillas' | 'total_haberes' | 'total_descuentos' | 'total_liquido'
  >
  icon: any
  desc: string
  currency?: boolean
  highlight?: boolean
}

const statConfig: StatConfigItem[] = [
  { label: 'Total personal', key: 'total_personal', icon: Users, desc: 'Empleados registrados' },
  { label: 'Planillas', key: 'total_planillas', icon: FileSpreadsheet, desc: 'Nóminas generadas' },
  { label: 'Total haberes', key: 'total_haberes', icon: TrendingUp, desc: 'Ingresos del periodo', currency: true },
  { label: 'Descuentos', key: 'total_descuentos', icon: TrendingDown, desc: 'Deducciones del periodo', currency: true },
  { label: 'Pago líquido', key: 'total_liquido', icon: DollarSign, desc: 'Total a pagar', currency: true, highlight: true },
]

export default function Dashboard() {
  const navigate = useNavigate()

  const [data, setData] = useState<Resumen | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    dashboardApi
      .getResumen()
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const currentMonth = useMemo(
    () => new Date().toLocaleDateString('es-PE', { month: 'long', year: 'numeric' }).toUpperCase(),
    [],
  )

  const planillasFiltradas = useMemo(() => {
    const list = data?.planillas_mes ?? []
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter((p: any) => {
      const nombres = `${p.personal?.apellidos ?? ''} ${p.personal?.nombres ?? ''}`.toLowerCase()
      const dni = `${p.personal?.dni ?? ''}`.toLowerCase()
      const puesto = `${p.personal?.puesto ?? ''}`.toLowerCase()
      return nombres.includes(q) || dni.includes(q) || puesto.includes(q)
    })
  }, [data, search])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[420px]">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-5 h-5 text-rose-600" />
            <span className="text-sm font-semibold text-rose-700">Dashboard</span>
          </div>
          <h2 className="page-title">Dashboard Overview</h2>
          <p className="text-slate-500 mt-1">Resumen del sistema de nóminas</p>
        </div>

        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-2 bg-rose-50 rounded-xl">
            <Calendar className="w-5 h-5 text-rose-700" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Periodo actual</p>
            <p className="text-sm font-bold text-slate-900">{currentMonth}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 lg:gap-6">
        {statConfig.map((stat, idx) => (
          <div
            key={idx}
            className={['metric-card card-hover', stat.highlight ? 'ring-2 ring-rose-600/30' : ''].join(' ')}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="min-w-0">
                <p className="stat-label">{stat.label}</p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{stat.desc}</p>
              </div>

              <div className="stat-icon bg-gradient-to-br from-rose-600 to-red-700 shadow-lg shadow-rose-600/15">
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>

            <p className="stat-value">
              {stat.currency
                ? formatCurrency((data?.[stat.key] as number) || 0)
                : ((data?.[stat.key] as number) || 0)}
            </p>

            {stat.highlight && (
              <div className="mt-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-700">Listo para procesar</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3">
          {data?.planillas_mes && data.planillas_mes.length > 0 ? (
            <div className="section-card">
              <div className="section-header">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-rose-600 to-red-700 rounded-xl shadow-lg shadow-rose-600/15">
                    <ListChecks className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">Actividad reciente</h3>
                    <p className="text-sm text-slate-500">
                      {planillasFiltradas.length} registro(s) del periodo
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="search-box">
                    <Search className="w-4 h-4 search-box-icon" />
                    <input
                      className="input"
                      placeholder="Buscar empleado, DNI o puesto…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  <button
                    className="btn-secondary flex items-center gap-2 text-sm py-2.5 px-4"
                    onClick={() => navigate('/planillas')}
                  >
                    Ver todas <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="rounded-tl-xl">Empleado</th>
                      <th>DNI</th>
                      <th className="text-right">Haberes</th>
                      <th className="text-right">Descuentos</th>
                      <th className="text-right rounded-tr-xl">Líquido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {planillasFiltradas.slice(0, 10).map((p: any) => (
                      <tr key={p.id} className="table-row">
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-600 to-red-700 text-white font-extrabold flex items-center justify-center shadow shadow-rose-600/15">
                              {(p.personal?.nombres?.charAt(0) || p.personal?.apellidos?.charAt(0) || '?').toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate">
                                {p.personal?.apellidos} {p.personal?.nombres}
                              </p>
                              <p className="text-xs text-slate-500 truncate">{p.personal?.puesto || 'Sin puesto'}</p>
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
                      </tr>
                    ))}

                    {planillasFiltradas.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-slate-500">
                          Sin resultados para “{search}”.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="section-card border-2 border-dashed border-slate-200">
              <div className="empty-state">
                <div className="empty-state-icon">
                  <FileSpreadsheet className="w-7 h-7 text-rose-600" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 mb-1">Sin planillas registradas</h3>
                <p className="text-slate-500 mb-5">Importa un Excel o crea una planilla manualmente.</p>
                <button className="btn-primary" onClick={() => navigate('/importar')}>
                  Importar Excel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="section-card">
            <h3 className="font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-rose-600" />
              Acciones rápidas
            </h3>

            <div className="space-y-2.5">
              <button
                className="w-full flex items-center justify-between gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-all text-left border border-slate-100"
                onClick={() => navigate('/personal')}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-rose-600 to-red-700 shadow shadow-rose-600/15">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-slate-800">Gestionar personal</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                className="w-full flex items-center justify-between gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-all text-left border border-slate-100"
                onClick={() => navigate('/planillas')}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-rose-600 to-red-700 shadow shadow-rose-600/15">
                    <FileSpreadsheet className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-slate-800">Ver planillas</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                className="w-full flex items-center justify-between gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-all text-left border border-slate-100"
                onClick={() => navigate('/importar')}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-rose-600 to-red-700 shadow shadow-rose-600/15">
                    <Activity className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-slate-800">Importar Excel</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          <div className="section-card bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white border border-slate-800">
            <h3 className="font-extrabold text-white mb-2">Centro de ayuda</h3>
            <p className="text-sm text-white/80 mb-4">Revisa el formato y recomendaciones antes de importar.</p>
            <button className="w-full bg-white/10 hover:bg-white/15 text-white font-semibold py-2.5 rounded-xl transition-all text-sm">
              Ver guía
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value || 0)
}