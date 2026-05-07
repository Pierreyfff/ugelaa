import { useEffect, useState } from 'react'
import { dashboardApi } from '../services/api'
import { Users, FileSpreadsheet, TrendingUp, TrendingDown, DollarSign, Calendar, ArrowRight, Activity, Clock, CheckCircle } from 'lucide-react'

interface Resumen {
  total_personal: number
  total_planillas: number
  total_haberes: number
  total_descuentos: number
  total_liquido: number
  planillas_mes: any[]
}

const statConfig = [
  { label: 'Total Personal', key: 'total_personal', icon: Users, color: 'from-cyan-400 to-blue-500', bg: 'bg-cyan-500', desc: 'Empleados registrados' },
  { label: 'Planillas', key: 'total_planillas', icon: FileSpreadsheet, color: 'from-violet-500 to-purple-600', bg: 'bg-violet-500', desc: 'Nóminas generadas' },
  { label: 'Total Haberes', key: 'total_haberes', icon: TrendingUp, color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-500', desc: 'Ingresos mensual', currency: true },
  { label: 'Descuentos', key: 'total_descuentos', icon: TrendingDown, color: 'from-rose-500 to-red-500', bg: 'bg-rose-500', desc: 'Deducciones mensual', currency: true },
  { label: 'Pago Liquido', key: 'total_liquido', icon: DollarSign, color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-500', desc: 'Total a pagar', currency: true, highlight: true },
]

export default function Dashboard() {
  const [data, setData] = useState<Resumen | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi.getResumen()
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="spinner"></div>
      </div>
    )
  }

  const currentMonth = new Date().toLocaleDateString('es-PE', { month: 'long', year: 'numeric' }).toUpperCase()

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-5 h-5 text-cyan-500" />
            <span className="text-sm font-medium text-cyan-600">Dashboard</span>
          </div>
          <h2 className="page-title">Bienvenido de nuevo</h2>
          <p className="text-slate-500 mt-1">Resumen de tu sistema de nóminas</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-2 bg-cyan-50 rounded-xl">
            <Calendar className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase">Fecha actual</p>
            <p className="text-sm font-semibold text-slate-800">{currentMonth}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
        {statConfig.map((stat, idx) => (
          <div key={idx} className={`metric-card card-hover ${stat.highlight ? 'ring-2 ring-cyan-400/50' : ''}`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="stat-label">{stat.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{stat.desc}</p>
              </div>
              <div className={`stat-icon bg-gradient-to-br ${stat.color}`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="stat-value">
              {stat.currency ? formatCurrency(data?.[stat.key as keyof Resumen] as number || 0) : (data?.[stat.key as keyof Resumen] as number || 0)}
            </p>
            {stat.highlight && (
              <div className="mt-3 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-medium text-emerald-600">Último mes procesado</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          {data?.planillas_mes && data.planillas_mes.length > 0 ? (
            <div className="section-card">
              <div className="section-header">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl">
                    <FileSpreadsheet className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Planillas del Mes</h3>
                    <p className="text-sm text-slate-500">{data.planillas_mes.length} registros</p>
                  </div>
                </div>
                <button className="btn-secondary flex items-center gap-2 text-sm py-2.5 px-4">
                  Ver todas <ArrowRight className="w-4 h-4" />
                </button>
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
                    {data.planillas_mes.slice(0, 8).map((p: any) => (
                      <tr key={p.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="avatar avatar-blue">
                              {p.personal?.nombres?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">{p.personal?.apellidos} {p.personal?.nombres}</p>
                              <p className="text-xs text-slate-500">{p.personal?.puesto || 'Sin puesto'}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="font-mono text-sm bg-slate-100 px-2.5 py-1 rounded-lg text-slate-600">{p.personal?.dni || '-'}</span>
                        </td>
                        <td className="text-right">
                          <span className="font-semibold text-emerald-600">{formatCurrency(p.total_haberes)}</span>
                        </td>
                        <td className="text-right">
                          <span className="font-semibold text-red-500">{formatCurrency(p.total_descuentos)}</span>
                        </td>
                        <td className="text-right">
                          <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-bold text-sm shadow-md">
                            {formatCurrency(p.total_liquido)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="section-card border-2 border-dashed border-slate-200">
              <div className="empty-state">
                <div className="empty-state-icon">
                  <FileSpreadsheet className="w-7 h-7 text-cyan-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Sin planillas registradas</h3>
                <p className="text-slate-500 mb-5">Importa un archivo Excel o crea una planilla manualmente</p>
                <button className="btn-primary">Crear Primera Planilla</button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="section-card">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-500" />
              Acciones Rápidas
            </h3>
            <div className="space-y-2.5">
              {[
                { label: 'Nuevo Empleado', icon: Users, color: 'from-cyan-500 to-blue-500' },
                { label: 'Crear Planilla', icon: FileSpreadsheet, color: 'from-violet-500 to-purple-500' },
                { label: 'Importar Excel', icon: Activity, color: 'from-emerald-500 to-teal-500' },
              ].map((action, idx) => (
                <button key={idx} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all text-left">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${action.color}`}>
                    <action.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="section-card bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
            <h3 className="font-bold text-white mb-2">¿Necesitas ayuda?</h3>
            <p className="text-sm text-white/80 mb-4">Consulta la documentación para entender el sistema</p>
            <button className="w-full bg-white/20 hover:bg-white/30 text-white font-medium py-2.5 rounded-xl transition-all text-sm">
              Ver Guía
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}