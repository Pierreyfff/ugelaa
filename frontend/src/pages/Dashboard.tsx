import { useEffect, useState } from 'react'
import { dashboardApi } from '../services/api'
import { Link } from 'react-router-dom'
import { Users, FileSpreadsheet, Calendar, ArrowRight, Activity, TrendingUp, TrendingDown, DollarSign, Plus, FileText } from 'lucide-react'

interface Resumen {
  total_personal: number
  total_planillas: number
  total_haberes: number
  total_descuentos: number
  total_liquido: number
  planillas_mes: any[]
}

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
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-red-600">Panel de Control</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Bienvenido de nuevo</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Resumen de tu sistema de nóminas</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, key) => (
            <div key={key} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3"></div>
                  <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const currentMonth = new Date().toLocaleDateString('es-PE', { month: 'long', year: 'numeric' }).toUpperCase()

  const stats = [
    {
      label: 'Total Personal',
      value: data?.total_personal || 0,
      icon: Users,
      bg: 'bg-red-600',
      link: '/personal'
    },
    {
      label: 'Planillas Creadas',
      value: data?.total_planillas || 0,
      icon: FileSpreadsheet,
      bg: 'bg-gray-700',
      link: '/planillas'
    },
    {
      label: 'Total Haberes',
      value: formatCurrency(data?.total_haberes || 0),
      icon: TrendingUp,
      bg: 'bg-gray-500'
    },
    {
      label: 'Total Descuentos',
      value: formatCurrency(data?.total_descuentos || 0),
      icon: TrendingDown,
      bg: 'bg-gray-400'
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-semibold text-red-600">Panel de Control</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Bienvenido de nuevo</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Resumen de tu sistema de nóminas</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Fecha actual</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{currentMonth}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, idx) => (
          <Link
            key={idx}
            to={stat.link || '#'}
            className="group bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{stat.label}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg} shadow-sm group-hover:scale-105 transition-transform`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg">
                <FileSpreadsheet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Planillas del Mes</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{data?.planillas_mes?.length || 0} registros</p>
              </div>
            </div>
            <Link to="/planillas" className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 transition-all">
              Ver todas <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {data?.planillas_mes && data.planillas_mes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4">Empleado</th>
                    <th className="text-left py-3 px-4">DNI</th>
                    <th className="text-right py-3 px-4">Haberes</th>
                    <th className="text-right py-3 px-4">Descuentos</th>
                    <th className="text-right py-3 px-4">Líquido</th>
                  </tr>
                </thead>
                <tbody>
                  {data.planillas_mes.slice(0, 6).map((p: any) => (
                    <tr key={p.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            {p.personal?.nombres?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{p.personal?.apellidos} {p.personal?.nombres}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{p.personal?.puesto || 'Sin puesto'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg text-gray-700 dark:text-gray-300">{p.personal?.dni || '-'}</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{formatCurrency(p.total_haberes)}</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-semibold text-gray-500 dark:text-gray-400">{formatCurrency(p.total_descuentos)}</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm shadow-sm">
                          {formatCurrency(p.total_liquido)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Sin planillas registradas</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Importa un archivo Excel o crea una planilla manualmente</p>
              <Link to="/importar" className="btn-primary inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span>Importar Planilla</span>
              </Link>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </div>
              Acciones Rápidas
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Nuevo Empleado', icon: Users, link: '/personal' },
                { label: 'Crear Planilla', icon: FileSpreadsheet, link: '/planillas' },
                { label: 'Importar Excel', icon: Activity, link: '/importar' },
              ].map((action, idx) => (
                <Link
                  key={idx}
                  to={action.link}
                  className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all text-left group border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600"
                >
                  <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700 group-hover:bg-red-600 transition-colors">
                    <action.icon className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors flex-1">{action.label}</span>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Resumen del Mes</h3>
                <p className="text-white/70 text-sm">{currentMonth}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 px-4 bg-white/10 rounded-xl">
                <span className="text-white/80">Pago Líquido Total</span>
                <span className="font-bold text-xl">{formatCurrency(data?.total_liquido || 0)}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold">{data?.total_personal || 0}</p>
                  <p className="text-xs text-white/70">Empleados</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold">{data?.total_planillas || 0}</p>
                  <p className="text-xs text-white/70">Planillas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h4 className="font-bold text-gray-900 dark:text-white mb-4">Estadísticas</h4>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Personal activo</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{data?.total_personal || 0} empleados</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-red-600 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Planillas del mes</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{data?.planillas_mes?.length || 0} planillas</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gray-600 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h4 className="font-bold text-gray-900 dark:text-white mb-4">Resumen Financiero</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Haberes</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(data?.total_haberes || 0)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Descuentos</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(data?.total_descuentos || 0)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-700 dark:text-red-400">Líquido a Pagar</span>
              </div>
              <span className="font-bold text-red-700 dark:text-red-400">{formatCurrency(data?.total_liquido || 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value)
}