import { useState } from 'react'
import { Settings, User, Bell, Shield, Database, Monitor, Globe, Save, Check, Palette as PaletteIcon, Key, Eye, EyeOff } from 'lucide-react'

export default function Configuracion() {
  const [notifications, setNotifications] = useState({
    planilla: true,
    empleados: true,
    errores: true,
    semanal: false,
  })
  const [activeTab, setActiveTab] = useState('general')
  const [saved, setSaved] = useState(false)
  const [formData, setFormData] = useState({
    nombre: 'Administrador',
    email: 'admin@planillas.su',
    idioma: 'es',
    zonaHoraria: 'America/Lima',
  })
  const [passwords, setPasswords] = useState({
    actual: '',
    nueva: '',
    confirmar: '',
  })
  const [showPass, setShowPass] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'perfil', label: 'Perfil', icon: User },
    { id: 'seguridad', label: 'Seguridad', icon: Shield },
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
    { id: 'apariencia', label: 'Apariencia', icon: PaletteIcon },
    { id: 'base-datos', label: 'Base de Datos', icon: Database },
  ]

  return (
    <div className="min-h-screen">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-5 h-5 text-cyan-500" />
          <span className="text-sm font-medium text-cyan-600">Administración</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Configuración</h2>
        <p className="mt-1 text-slate-500">Personaliza y administra tu sistema</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 rounded-2xl border overflow-hidden flex-shrink-0 bg-white border-slate-100">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800">Configuración</h3>
          </div>
          <nav className="p-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left mb-1 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1">
          {activeTab === 'general' && (
            <div className="rounded-2xl border p-6 bg-white border-slate-100">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Configuración General</h3>
                  <p className="text-xs text-slate-500">Parámetros básicos del sistema</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <Globe className="w-4 h-4 inline mr-1" /> Idioma
                    </label>
                    <select
                      value={formData.idioma}
                      onChange={e => setFormData({ ...formData, idioma: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border bg-white border-slate-200 text-slate-800 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="es">Español (Perú)</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      <Globe className="w-4 h-4 inline mr-1" /> Zona Horaria
                    </label>
                    <select
                      value={formData.zonaHoraria}
                      onChange={e => setFormData({ ...formData, zonaHoraria: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border bg-white border-slate-200 text-slate-800 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="America/Lima">Lima (UTC-5)</option>
                      <option value="America/New_York">New York (UTC-5)</option>
                      <option value="Europe/Madrid">Madrid (UTC+1)</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-cyan-50 rounded-xl border border-cyan-200">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Monitor className="w-5 h-5 text-cyan-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-cyan-800 text-sm">Modo de pantalla</h4>
                      <p className="text-xs text-cyan-600 mt-1">El sistema se muestra según la configuración de tu pantalla</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'perfil' && (
            <div className="rounded-2xl border p-6 bg-white border-slate-100">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Mi Perfil</h3>
                  <p className="text-xs text-slate-500">Información de tu cuenta</p>
                </div>
              </div>

              <div className="flex items-center gap-6 mb-6 p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl">
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                  AD
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Administrador</h4>
                  <p className="text-sm text-slate-500">admin@planillas.su</p>
                  <span className="inline-block mt-2 px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-xs font-medium">
                    Administrador del Sistema
                  </span>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nombre Completo</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border bg-white border-slate-200 text-slate-800 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Correo Electrónico</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border bg-white border-slate-200 text-slate-800 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'seguridad' && (
            <div className="rounded-2xl border p-6 bg-white border-slate-100">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-red-500 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Seguridad</h3>
                  <p className="text-xs text-slate-500">Cambiar contraseña y configuración de seguridad</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-3">
                    <Key className="w-5 h-5 text-amber-600" />
                    <p className="text-sm text-amber-800">
                      Recomendamos cambiar tu contraseña cada 90 días para mayor seguridad
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Contraseña Actual</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={passwords.actual}
                      onChange={e => setPasswords({ ...passwords, actual: e.target.value })}
                      className="w-full px-4 py-3 pr-12 rounded-xl border bg-white border-slate-200 text-slate-800 focus:outline-none focus:border-cyan-500"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-500"
                    >
                      {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Nueva Contraseña</label>
                    <input
                      type="password"
                      value={passwords.nueva}
                      onChange={e => setPasswords({ ...passwords, nueva: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border bg-white border-slate-200 text-slate-800 focus:outline-none focus:border-cyan-500"
                      placeholder="Mínimo 8 caracteres"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Confirmar Contraseña</label>
                    <input
                      type="password"
                      value={passwords.confirmar}
                      onChange={e => setPasswords({ ...passwords, confirmar: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border bg-white border-slate-200 text-slate-800 focus:outline-none focus:border-cyan-500"
                      placeholder="Repite la contraseña"
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Sesiones activas</h4>
                  <div className="flex items-center justify-between py-3 border-b border-slate-200 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-700">Sesión actual</p>
                      <p className="text-xs text-slate-500">Windows • Chrome • localhost</p>
                    </div>
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium">Activa</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notificaciones' && (
            <div className="rounded-2xl border p-6 bg-white border-slate-100">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Notificaciones</h3>
                  <p className="text-xs text-slate-500">Configura cómo recibes las alertas</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { key: 'planilla', label: 'Nuevas planillas', desc: 'Recibe alertas cuando se cree una nueva planilla', color: 'from-cyan-500 to-blue-500' },
                  { key: 'empleados', label: 'Cambios en empleados', desc: 'Notificar cuando se agreguen o modifiquen empleados', color: 'from-violet-500 to-purple-500' },
                  { key: 'errores', label: 'Errores del sistema', desc: 'Alertas críticas de errores o problemas', color: 'from-rose-500 to-red-500' },
                  { key: 'semanal', label: 'Resumen semanal', desc: 'Recibe un resumen cada semana de la actividad', color: 'from-emerald-500 to-teal-500' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-4 rounded-xl border bg-slate-50 border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center`}>
                        <Bell className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}
                      className={`relative w-12 h-7 rounded-full transition-colors ${
                        notifications[item.key as keyof typeof notifications]
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                          : 'bg-slate-300'
                      }`}
                    >
                      <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                        notifications[item.key as keyof typeof notifications] ? 'right-1' : 'left-1'
                      }`}></span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'apariencia' && (
            <div className="rounded-2xl border p-6 bg-white border-slate-100">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <PaletteIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Apariencia</h3>
                  <p className="text-xs text-slate-500">Personaliza la interfaz del sistema</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-800 mb-3">Colores del tema</h4>
                <div className="flex gap-3">
                  {[
                    { name: 'Cyan', color: 'from-cyan-500 to-blue-500', active: true },
                    { name: 'Violeta', color: 'from-violet-500 to-purple-500', active: false },
                    { name: 'Esmeralda', color: 'from-emerald-500 to-teal-500', active: false },
                    { name: 'Amber', color: 'from-amber-500 to-orange-500', active: false },
                  ].map(theme => (
                    <button
                      key={theme.name}
                      className={`w-16 h-16 rounded-xl bg-gradient-to-br ${theme.color} flex items-center justify-center shadow-lg hover:scale-105 transition-transform ${theme.active ? 'ring-2 ring-offset-2 ring-cyan-500' : ''}`}
                    >
                      {theme.active && <Check className="w-6 h-6 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'base-datos' && (
            <div className="rounded-2xl border p-6 bg-white border-slate-100">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <Database className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Base de Datos</h3>
                  <p className="text-xs text-slate-500">Información de conexión y gestión</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl border bg-slate-50 border-slate-100">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500 text-xs mb-1">Servidor</p>
                      <p className="font-mono text-cyan-600">postgres:5432</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs mb-1">Base de datos</p>
                      <p className="font-mono text-cyan-600">planillas</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs mb-1">Usuario</p>
                      <p className="font-mono text-cyan-600">planillas</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs mb-1">Estado</p>
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> Conectado
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border bg-slate-50 border-slate-100 text-center">
                    <p className="text-2xl font-bold text-slate-900">156</p>
                    <p className="text-xs text-slate-500">Registros Personal</p>
                  </div>
                  <div className="p-4 rounded-xl border bg-slate-50 border-slate-100 text-center">
                    <p className="text-2xl font-bold text-slate-900">1,245</p>
                    <p className="text-xs text-slate-500">Planillas Totales</p>
                  </div>
                  <div className="p-4 rounded-xl border bg-slate-50 border-slate-100 text-center">
                    <p className="text-2xl font-bold text-slate-900">4.2 MB</p>
                    <p className="text-xs text-slate-500">Tamaño BD</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-end gap-3">
            <button className="px-6 py-3 rounded-xl font-medium transition-all bg-slate-100 text-slate-600 hover:bg-slate-200">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-xl font-medium shadow-lg shadow-cyan-500/30 transition-all flex items-center gap-2"
            >
              {saved ? (
                <>
                  <Check className="w-5 h-5" /> Guardado
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" /> Guardar Cambios
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}