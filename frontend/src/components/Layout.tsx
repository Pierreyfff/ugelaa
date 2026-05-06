import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Users, FileSpreadsheet, Upload, Settings, Bell } from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', desc: 'Resumen' },
  { to: '/personal', icon: Users, label: 'Personal', desc: 'Empleados' },
  { to: '/planillas', icon: FileSpreadsheet, label: 'Planillas', desc: 'Nóminas' },
  { to: '/importar', icon: Upload, label: 'Importar', desc: 'Excel' },
]

export default function Layout() {
  return (
    <div className="min-h-screen">
      <nav className="bg-white/90 backdrop-blur-md border-b-2 border-sky-200/50 sticky top-0 z-50 shadow-lg shadow-sky-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-18">
            <div className="flex items-center gap-3 py-3">
              <div className="w-12 h-12 bg-gradient-to-br from-sky-400 via-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/40">
                <FileSpreadsheet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-sky-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Sistema de Planillas
                </h1>
                <p className="text-xs text-slate-500 -mt-0.5 font-medium">Gestión de Personal</p>
              </div>
            </div>
            <div className="flex items-center gap-2 py-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    isActive 
                      ? 'nav-item nav-item-active' 
                      : 'nav-item nav-item-inactive'
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
            <div className="flex items-center gap-3 py-3">
              <button className="btn-icon text-slate-500 hover:text-sky-600 hover:bg-sky-50">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
              </button>
              <button className="btn-icon text-slate-500 hover:text-blue-600 hover:bg-blue-50">
                <Settings className="w-5 h-5" />
              </button>
              <div className="w-11 h-11 bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-sky-500/30 ml-2">
                A
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}