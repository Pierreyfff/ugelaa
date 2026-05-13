import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { dashboardApi } from '../services/api'
import {
  Users,
  FileSpreadsheet,
  DollarSign,
  Calendar,
  ArrowRight,
  Search,
  ListChecks,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'

interface Resumen {
  total_personal: number
  total_planillas: number
  total_haberes: number
  total_descuentos: number
  total_liquido: number
  planillas_mes: any[]
}

const statConfig = [
  { label: 'Total Personal', key: 'total_personal' as keyof Resumen, icon: Users, desc: 'Empleados registrados' },
  { label: 'Planillas', key: 'total_planillas' as keyof Resumen, icon: FileSpreadsheet, desc: 'Nóminas generadas' },
  { label: 'Total Haberes', key: 'total_haberes' as keyof Resumen, icon: TrendingUp, desc: 'Ingresos del periodo', currency: true },
  { label: 'Descuentos', key: 'total_descuentos' as keyof Resumen, icon: TrendingDown, desc: 'Deducciones del periodo', currency: true },
  { label: 'Pago Líquido', key: 'total_liquido' as keyof Resumen, icon: DollarSign, desc: 'Total a pagar', currency: true, highlight: true },
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="text-gray-500 mt-1">Resumen general del sistema de nóminas</p>
        </div>

        <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm">
          <div className="p-2 bg-red-50 rounded-lg">
            <Calendar className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase">Periodo actual</p>
            <p className="text-sm font-bold text-gray-900">{currentMonth}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {statConfig.map((stat, idx) => (
          <div
            key={idx}
            className={[
              'bg-white rounded-2xl border p-5 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5',
              stat.highlight ? 'border-red-200 ring-2 ring-red-500/10' : 'border-gray-100',
            ].join(' ')}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{stat.label}</p>
                <p className="text-xs text-gray-400 mt-1">{stat.desc}</p>
              </div>
              <div className={[
                'w-10 h-10 rounded-xl flex items-center justify-center',
                stat.highlight ? 'bg-gradient-to-br from-red-600 to-red-700' : 'bg-gray-100'
              ].join(' ')}>
                <stat.icon className={`w-5 h-5 ${stat.highlight ? 'text-white' : 'text-gray-600'}`} />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-gray-900 mt-3">
              {stat.currency
                ? formatCurrency((data?.[stat.key] as number) || 0)
                : ((data?.[stat.key] as number) || 0)}
            </p>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Table */}
        <div className="xl:col-span-3">
          {data?.planillas_mes && data.planillas_mes.length > 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                    <ListChecks className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Actividad Reciente</h3>
                    <p className="text-sm text-gray-500">{planillasFiltradas.length} registros del periodo</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      className="input pl-10 w-64"
                      placeholder="Buscar empleado, DNI..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  <button
                    className="btn-secondary flex items-center gap-2 text-sm"
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
                      <th>Empleado</th>
                      <th>DNI</th>
                      <th className="text-right">Haberes</th>
                      <th className="text-right">Descuentos</th>
                      <th className="text-right">Líquido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {planillasFiltradas.slice(0, 10).map((p: any) => (
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
                              <p className="text-xs text-gray-500 truncate">{p.personal?.puesto || 'Sin puesto'}</p>
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
                      </tr>
                    ))}

                    {planillasFiltradas.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500">
                          Sin resultados para "{search}"
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8">
              <div className="empty-state">
                <div className="empty-state-icon">
                  <FileSpreadsheet className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Sin planillas registradas</h3>
                <p className="text-gray-500 mb-5">Importa un Excel o crea una planilla manualmente.</p>
                <button className="btn-primary" onClick={() => navigate('/importar')}>
                  Importar Excel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-600 rounded-full"></span>
              Acciones Rápidas
            </h3>

            <div className="space-y-2">
              <button
                className="w-full flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all text-left border border-transparent hover:border-gray-200"
                onClick={() => navigate('/personal')}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-50">
                    <Users className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Gestionar personal</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </button>

              <button
                className="w-full flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all text-left border border-transparent hover:border-gray-200"
                onClick={() => navigate('/planillas')}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-50">
                    <FileSpreadsheet className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Ver planillas</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </button>

              <button
                className="w-full flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all text-left border border-transparent hover:border-gray-200"
                onClick={() => navigate('/importar')}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-50">
                    <FileSpreadsheet className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Importar Excel</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white">
            <h3 className="font-bold text-white mb-2">Centro de Ayuda</h3>
            <p className="text-sm text-white/70 mb-4">Revisa el formato y recomendaciones antes de importar.</p>
            <button className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-2.5 rounded-xl transition-all text-sm">
              Ver Guía
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