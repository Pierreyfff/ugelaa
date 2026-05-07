import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Users, FileSpreadsheet, Upload, Settings, Bell, Menu, X, PanelLeftClose, PanelLeft, LogOut, User, ChevronDown } from 'lucide-react'
import { useState, useEffect } from 'react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', desc: 'Resumen general' },
  { to: '/personal', icon: Users, label: 'Personal', desc: 'Empleados' },
  { to: '/planillas', icon: FileSpreadsheet, label: 'Planillas', desc: 'Nóminas' },
  { to: '/importar', icon: Upload, label: 'Importar', desc: 'Cargar datos' },
]

export default function Layout() {
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
    if (!isMobile) {
      setSidebarVisible(true)
    } else {
      setSidebarVisible(false)
    }
  }, [isMobile])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30">
      {sidebarVisible && !isMobile && (
        <aside className={`fixed inset-y-0 left-0 z-50 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl shadow-slate-900/50 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-72'}`}>
          <div className="flex flex-col h-full">
            <div className="p-5 border-b border-slate-700/50">
              <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <FileSpreadsheet className="w-6 h-6 text-white" />
                  </div>
                  {!isCollapsed && (
                    <div>
                      <h1 className="text-lg font-bold text-white">Planillas SU</h1>
                      <p className="text-xs text-slate-400">Gestión de Personal</p>
                    </div>
                  )}
                </div>
                {!isCollapsed && (
                  <button
                    onClick={() => setIsCollapsed(true)}
                    className="p-2 rounded-xl hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
                  >
                    <PanelLeftClose className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {isCollapsed && (
              <div className="p-3 border-b border-slate-700/30">
                <button
                  onClick={() => setIsCollapsed(false)}
                  className="w-full flex items-center justify-center p-3 rounded-xl hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
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
                    `group flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25'
                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                    } ${isCollapsed ? 'justify-center px-2' : ''}`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={`p-2.5 rounded-xl ${isActive ? 'bg-white/20' : 'bg-slate-700/50'} flex-shrink-0`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      {!isCollapsed && (
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{item.label}</p>
                          <p className="text-xs text-slate-500">{item.desc}</p>
                        </div>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            <div className={`p-4 border-t border-slate-700/50 ${isCollapsed ? 'px-2' : ''}`}>
              <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all ${isCollapsed ? 'justify-center px-2' : ''}`}>
                <div className="p-2.5 rounded-xl bg-slate-700/50 flex-shrink-0">
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

      {sidebarVisible && isMobile && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40" onClick={() => setSidebarVisible(false)}>
          <aside className="fixed inset-y-0 left-0 w-80 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl animate-slide-in" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col h-full">
              <div className="p-5 border-b border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <FileSpreadsheet className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-white">Planillas SU</h1>
                    <p className="text-xs text-slate-400">Gestión de Personal</p>
                  </div>
                </div>
                <button onClick={() => setSidebarVisible(false)} className="p-2.5 rounded-xl hover:bg-slate-700 text-slate-300">
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
                      `group flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25'
                          : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                      }`
                    }
                  >
                    <div className="p-2.5 rounded-xl bg-slate-700/50">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  </NavLink>
                ))}
              </nav>

              <div className="p-4 border-t border-slate-700/50">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all">
                  <div className="p-2.5 rounded-xl bg-slate-700/50">
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

      <div className={`transition-all duration-300 ${!isMobile && !sidebarVisible ? 'lg:ml-0' : !isMobile ? (isCollapsed ? 'lg:ml-20' : 'lg:ml-72') : ''}`}>
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-2xl border-b border-slate-200/60 shadow-sm">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              {!sidebarVisible && !isMobile && (
                <button
                  onClick={() => setSidebarVisible(true)}
                  className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-all"
                  title="Abrir menú"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}
              {isMobile && (
                <button
                  onClick={() => setSidebarVisible(true)}
                  className="lg:hidden p-2.5 rounded-xl hover:bg-slate-100 text-slate-600"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Sistema de Nóminas</h2>
                <p className="text-xs text-slate-500">{new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="relative p-2.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-cyan-600 transition-all">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 pl-3 border-l border-slate-200 hover:bg-slate-50 rounded-xl py-1.5 pr-2 transition-all"
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-slate-800">Administrador</p>
                    <p className="text-xs text-slate-500">Usuario</p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20">
                    A
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-slate-600 hover:bg-slate-50 transition-all">
                      <User className="w-4 h-4" />
                      <span className="text-sm">Perfil</span>
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-red-500 hover:bg-red-50 transition-all">
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">Cerrar sesión</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">
          <div className="max-w-full mx-0">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}