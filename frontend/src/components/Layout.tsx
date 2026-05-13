import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  Upload,
  Menu,
  X,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  ChevronDown,
} from 'lucide-react'
import { useEffect, useState } from 'react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', desc: 'Resumen general' },
  { to: '/personal', icon: Users, label: 'Personal', desc: 'Empleados' },
  { to: '/planillas', icon: FileSpreadsheet, label: 'Planillas', desc: 'Nóminas' },
  { to: '/importar', icon: Upload, label: 'Importar', desc: 'Cargar datos' },
]

export default function Layout() {
  const navigate = useNavigate()

  const [sidebarVisible, setSidebarVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (!isMobile) setSidebarVisible(true)
    else setSidebarVisible(false)
  }, [isMobile])

  // UX: cerrar menú usuario al navegar
  useEffect(() => {
    const onClick = () => setUserMenuOpen(false)
    window.addEventListener('click', onClick)
    return () => window.removeEventListener('click', onClick)
  }, [])

  const AppShellBg = 'min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100'

  const BrandBadge = (
    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-rose-600 via-red-600 to-red-700 shadow-rose-600/20">
      <FileSpreadsheet className="w-6 h-6 text-white" />
    </div>
  )

  return (
    <div className={AppShellBg}>
      {/* ===== Desktop sidebar ===== */}
      {sidebarVisible && !isMobile && (
        <aside
          className={[
            'fixed inset-y-0 left-0 z-50',
            'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950',
            'shadow-2xl shadow-slate-900/40',
            'transition-all duration-300 ease-in-out',
            isCollapsed ? 'w-20' : 'w-72',
          ].join(' ')}
        >
          <div className="flex flex-col h-full">
            <div className="p-5 border-b border-slate-800/60">
              <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                  {BrandBadge}
                  {!isCollapsed && (
                    <div>
                      <h1 className="text-lg font-extrabold tracking-tight text-white">UGELAA</h1>
                      <p className="text-xs text-slate-400">Payroll Admin Suite</p>
                    </div>
                  )}
                </div>
                {!isCollapsed && (
                  <button
                    onClick={() => setIsCollapsed(true)}
                    className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
                    title="Contraer"
                  >
                    <PanelLeftClose className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {isCollapsed && (
              <div className="p-3 border-b border-slate-800/40">
                <button
                  onClick={() => setIsCollapsed(false)}
                  className="w-full flex items-center justify-center p-3 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-all"
                  title="Expandir"
                >
                  <PanelLeft className="w-5 h-5" />
                </button>
              </div>
            )}

            <nav className={`flex-1 p-4 space-y-2 overflow-y-auto ${isCollapsed ? 'px-2' : ''}`}>
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      'group flex items-center gap-3 rounded-2xl transition-all duration-200',
                      isCollapsed ? 'justify-center px-2 py-3.5' : 'px-4 py-3.5',
                      isActive
                        ? 'bg-gradient-to-r from-rose-600 to-red-700 text-white shadow-lg shadow-rose-500/20'
                        : 'text-slate-300 hover:bg-slate-800/50 hover:text-white',
                    ].join(' ')
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div
                        className={[
                          'p-2.5 rounded-xl flex-shrink-0',
                          isActive ? 'bg-white/15' : 'bg-slate-800/50',
                        ].join(' ')}
                      >
                        <item.icon className="w-5 h-5" />
                      </div>

                      {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{item.label}</p>
                          <p className="text-xs text-slate-500 truncate">{item.desc}</p>
                        </div>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            <div className={`p-4 border-t border-slate-800/60 ${isCollapsed ? 'px-2' : ''}`}>
              <button
                className={[
                  'w-full flex items-center gap-3 rounded-2xl text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all',
                  isCollapsed ? 'justify-center px-2 py-3' : 'px-4 py-3',
                ].join(' ')}
              >
                <div className="p-2.5 rounded-xl bg-slate-800/50 flex-shrink-0">
                  <Settings className="w-5 h-5" />
                </div>
                {!isCollapsed && (
                  <div className="text-left">
                    <p className="font-semibold text-sm">Configuración</p>
                    <p className="text-xs text-slate-500">Ajustes del sistema</p>
                  </div>
                )}
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* ===== Mobile sidebar ===== */}
      {sidebarVisible && isMobile && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40"
          onClick={() => setSidebarVisible(false)}
        >
          <aside
            className="fixed inset-y-0 left-0 w-80 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 shadow-2xl animate-slide-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
              <div className="p-5 border-b border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {BrandBadge}
                  <div>
                    <h1 className="text-lg font-extrabold tracking-tight text-white">UGELAA</h1>
                    <p className="text-xs text-slate-400">Payroll Admin Suite</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarVisible(false)}
                  className="p-2.5 rounded-xl hover:bg-slate-800 text-slate-300"
                  aria-label="Cerrar menú"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarVisible(false)}
                    className={({ isActive }) =>
                      [
                        'group flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200',
                        isActive
                          ? 'bg-gradient-to-r from-rose-600 to-red-700 text-white shadow-lg shadow-rose-500/20'
                          : 'text-slate-300 hover:bg-slate-800/50 hover:text-white',
                      ].join(' ')
                    }
                  >
                    <div className="p-2.5 rounded-xl bg-slate-800/50">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  </NavLink>
                ))}
              </nav>

              <div className="p-4 border-t border-slate-800/60">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-300 hover:bg-slate-800/50 hover:text-white transition-all">
                  <div className="p-2.5 rounded-xl bg-slate-800/50">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">Configuración</p>
                    <p className="text-xs text-slate-500">Ajustes del sistema</p>
                  </div>
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ===== Main frame ===== */}
      <div
        className={[
          'transition-all duration-300',
          !isMobile && sidebarVisible ? (isCollapsed ? 'lg:ml-20' : 'lg:ml-72') : '',
        ].join(' ')}
      >
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-xl border-b border-slate-200/70 shadow-sm">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              {isMobile && (
                <button
                  onClick={() => setSidebarVisible(true)}
                  className="lg:hidden p-2.5 rounded-xl hover:bg-slate-100 text-slate-700"
                  aria-label="Abrir menú"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}

              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Sistema de Nóminas</h2>
                <p className="text-xs text-slate-500">
                  {new Date().toLocaleDateString('es-PE', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="relative p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-all" title="Notificaciones">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-600 rounded-full border-2 border-white"></span>
              </button>

              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 pl-3 border-l border-slate-200 hover:bg-slate-50 rounded-xl py-1.5 pr-2 transition-all"
                  aria-label="Menú de usuario"
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-slate-900">Administrador</p>
                    <p className="text-xs text-slate-500">Usuario</p>
                  </div>

                  {/* Sin foto, solo inicial con marca guinda */}
                  <div className="w-10 h-10 bg-gradient-to-br from-rose-600 to-red-700 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-lg shadow-rose-600/15">
                    A
                  </div>

                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 overflow-hidden">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs text-slate-500">Sesión</p>
                      <p className="text-sm font-semibold text-slate-900">Administrador</p>
                    </div>

                    <button
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-all"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      <span className="text-sm">Preferencias</span>
                    </button>

                    <button
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-rose-700 hover:bg-rose-50 transition-all"
                      onClick={() => {
                        setUserMenuOpen(false)
                        // aquí puedes limpiar token si tienes auth
                        navigate('/login')
                      }}
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm font-semibold">Cerrar sesión</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}