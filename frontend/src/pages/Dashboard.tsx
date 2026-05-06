import { useEffect, useState } from 'react'
import { dashboardApi } from '../services/api'
import { Users, FileSpreadsheet, TrendingUp, TrendingDown, DollarSign, Calendar, ArrowRight } from 'lucide-react'

interface Resumen {
  total_personal: number
  total_planillas: number
  total_haberes: number
  total_descuentos: number
  total_liquido: number
  planillas_mes: any[]
}

const statConfig = [
  { label: 'Total Personal', key: 'total_personal', icon: Users, color: 'from-sky-400 to-blue-500', bg: 'bg-sky-500/10' },
  { label: 'Planillas Registradas', key: 'total_planillas', icon: FileSpreadsheet, color: 'from-cyan-400 to-sky-500', bg: 'bg-cyan-500/10' },
  { label: 'Total Haberes', key: 'total_haberes', icon: TrendingUp, color: 'from-emerald-400 to-teal-500', bg: 'bg-emerald-500/10', currency: true },
  { label: 'Total Descuentos', key: 'total_descuentos', icon: TrendingDown, color: 'from-rose-400 to-red-500', bg: 'bg-rose-500/10', currency: true },
  { label: 'Líquido Total', key: 'total_liquido', icon: DollarSign, color: 'from-sky-400 to-cyan-500', bg: 'bg-sky-500/10', currency: true, highlight: true },
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
        <div className="w-14 h-14 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Bienvenido 👋</h2>
          <p className="text-slate-500 mt-1">Resumen del sistema de planillas</p>
        </div>
        <div className="flex items-center gap-2 bg-white/70 px-5 py-3 rounded-2xl border-2 border-sky-100 shadow-lg">
          <Calendar className="w-5 h-5 text-sky-500" />
          <span className="text-sm font-semibold text-slate-600">
            {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statConfig.map((stat, idx) => (
          <div key={idx} className={`card stat-card ${stat.highlight ? 'ring-2 ring-sky-400 shadow-sky-200/50' : ''}`}>
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full ${stat.bg} -mr-10 -mt-10`}></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-slate-500">{stat.label}</span>
                <div className={`stat-icon bg-gradient-to-br ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-800">
                {stat.currency ? formatCurrency(data?.[stat.key as keyof Resumen] as number || 0) : (data?.[stat.key as keyof Resumen] as number || 0)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {data?.planillas_mes && data.planillas_mes.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Planillas del Mes</h3>
              <p className="text-slate-500 text-sm">Últimos registros procesados</p>
            </div>
            <button className="btn-secondary flex items-center gap-2 text-sm">
              Ver todas <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-hidden rounded-xl border-2 border-sky-100">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-5 py-4">Empleado</th>
                  <th className="px-5 py-4">DNI</th>
                  <th className="px-5 py-4 text-right">Haberes</th>
                  <th className="px-5 py-4 text-right">Descuentos</th>
                  <th className="px-5 py-4 text-right">Líquido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100">
                {data.planillas_mes.slice(0, 8).map((p: any, idx: number) => (
                  <tr key={p.id} className="table-row" style={{ animationDelay: `${idx * 50}ms` }}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="avatar avatar-blue">
                          {p.personal?.nombres?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{p.personal?.apellidos} {p.personal?.nombres}</p>
                          <p className="text-xs text-slate-500">{p.personal?.puesto || 'Sin puesto'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-mono text-sm">{p.personal?.dni || '—'}</td>
                    <td className="px-5 py-4 text-right text-emerald-600 font-bold">{formatCurrency(p.total_haberes)}</td>
                    <td className="px-5 py-4 text-right text-rose-600 font-bold">{formatCurrency(p.total_descuentos)}</td>
                    <td className="px-5 py-4 text-right">
                      <span className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-sky-500/30">
                        {formatCurrency(p.total_liquido)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(!data?.planillas_mes || data.planillas_mes.length === 0) && (
        <div className="card text-center py-16 border-2 border-dashed border-sky-200">
          <div className="w-20 h-20 bg-gradient-to-br from-sky-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileSpreadsheet className="w-10 h-10 text-sky-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Sin planillas registradas</h3>
          <p className="text-slate-500 mb-6">Comienza importando un archivo Excel o creando una planilla</p>
          <button className="btn-primary mx-auto">Crear Primera Planilla</button>
        </div>
      )}
    </div>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}