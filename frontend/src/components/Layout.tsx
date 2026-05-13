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
  { to: '/personal', icon: Users, label: 'Personal', desc: 'Gestión de empleados' },
  { to: '/planillas', icon: FileSpreadsheet, label: 'Planillas', desc: 'Nóminas mensuales' },
  { to: '/importar', icon: Upload, label: 'Importar', desc: 'Cargar datos Excel' },
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

  useEffect(() => {
    const onClick = () => setUserMenuOpen(false)
    window.addEventListener('click', onClick)
    return () => window.removeEventListener('click', onClick)
  }, [])

  const formatDate = () => {
    return new Date().toLocaleDateString('es-PE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Desktop */}
      {sidebarVisible && !isMobile && (
        <aside
          className={[
            'fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 shadow-sm',
            'transition-all duration-300 ease-in-out',
            isCollapsed ? 'w-20' : 'w-64',
          ].join(' ')}
        >
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="h-16 flex items-center px-4 border-b border-gray-100">
              <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'gap-3'}`}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-red-600 to-red-700 shadow-lg shadow-red-600/20">
                  <FileSpreadsheet className="w-5 h-5 text-white" />
                </div>
                {!isCollapsed && (
                  <div>
                    <h1 className="text-lg font-extrabold text-gray-900 tracking-tight">UGELAA</h1>
                    <p className="text-xs text-gray-500">Sistema de Nóminas</p>
                  </div>
                )}
              </div>
            </div>

            {/* Botón collapse */}
            {isCollapsed ? (
              <div className="p-3 border-b border-gray-100">
                <button
                  onClick={() => setIsCollapsed(false)}
                  className="w-full flex items-center justify-center p-3 rounded-xl text-gray-600 hover:bg-gray-100 transition-all"
                  title="Expandir"
                >
                  <PanelLeft className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="p-3 border-b border-gray-100">
                <button
                  onClick={() => setIsCollapsed(true)}
                  className="w-full flex items-center justify-end px-3 py-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-all"
                  title="Contraer"
                >
                  <PanelLeftClose className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Navigation */}
            <nav className={`flex-1 p-3 space-y-1 overflow-y-auto ${isCollapsed ? 'px-2' : 'px-3'}`}>
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      'group flex items-center gap-3 rounded-xl transition-all duration-200',
                      isCollapsed ? 'justify-center px-3 py-3' : 'px-4 py-3',
                      isActive
                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                    ].join(' ')
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={['p-2 rounded-lg flex-shrink-0', isActive ? 'bg-white/20' : 'bg-gray-100'].join(' ')}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{item.label}</p>
                          <p className={`text-xs truncate ${isActive ? 'text-red-100' : 'text-gray-400'}`}>
                            {item.desc}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>
      )}

      {/* Mobile Sidebar */}
      {sidebarVisible && isMobile && (
        <div
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40"
          onClick={() => setSidebarVisible(false)}
        >
          <aside
            className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl animate-slide-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
              <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-red-600 to-red-700">
                    <FileSpreadsheet className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-extrabold text-gray-900">UGELAA</h1>
                    <p className="text-xs text-gray-500">Sistema de Nóminas</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarVisible(false)}
                  className="p-2 rounded-xl hover:bg-gray-100 text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarVisible(false)}
                    className={({ isActive }) =>
                      [
                        'group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                        isActive
                          ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                          : 'text-gray-600 hover:bg-gray-100',
                      ].join(' ')
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="p-2 rounded-lg bg-gray-100">
                          <item.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{item.label}</p>
                          <p className={`text-xs ${isActive ? 'text-red-100' : 'text-gray-400'}`}>{item.desc}</p>
                        </div>
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div
        className={[
          'transition-all duration-300',
          !isMobile && sidebarVisible ? (isCollapsed ? 'lg:ml-20' : 'lg:ml-64') : '',
        ].join(' ')}
      >
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-4 lg:px-6 h-16">
            <div className="flex items-center gap-4">
              {isMobile && (
                <button
                  onClick={() => setSidebarVisible(true)}
                  className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-700"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}

              <div>
                <h2 className="text-lg font-bold text-gray-900">Sistema de Nóminas</h2>
                <p className="text-xs text-gray-500 capitalize">{formatDate()}</p>
              </div>
            </div>

            {/* User Menu */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 pl-3 border-l border-gray-200 hover:bg-gray-50 rounded-xl py-1.5 pr-2 transition-all"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900">Administrador</p>
                  <p className="text-xs text-gray-500">Usuario</p>
                </div>

                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-red-600 to-red-700 shadow-md">
                  A
                </div>

                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-xs text-gray-500">Sesión activa</p>
                    <p className="text-sm font-semibold text-gray-900">Administrador</p>
                  </div>

                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-all"
                    onClick={() => {
                      setUserMenuOpen(false)
                      navigate('/auth')
                    }}
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Cerrar sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}