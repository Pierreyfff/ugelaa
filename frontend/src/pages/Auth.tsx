import { useState } from 'react'
import {
  LogIn,
  UserPlus,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  FileSpreadsheet,
  ShieldCheck,
} from 'lucide-react'

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Aquí conectarás /api/usuarios/login y /api/usuarios/registro
    console.log('Auth submit:', formData)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header / Brand */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-rose-600 via-red-600 to-red-700 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-rose-600/25">
            <FileSpreadsheet className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">UGELAA</h1>
          <p className="text-slate-500 mt-2">Payroll Admin Suite</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6">
          {/* Tabs */}
          <div className="flex rounded-2xl bg-slate-100 p-1 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={[
                'flex-1 py-3 px-4 rounded-xl font-extrabold transition-all duration-200',
                isLogin
                  ? 'bg-gradient-to-r from-rose-600 to-red-700 text-white shadow-lg shadow-rose-600/20'
                  : 'text-slate-600 hover:text-slate-900',
              ].join(' ')}
              type="button"
            >
              <LogIn className="w-5 h-5 inline-block mr-2" />
              Iniciar sesión
            </button>

            <button
              onClick={() => setIsLogin(false)}
              className={[
                'flex-1 py-3 px-4 rounded-xl font-extrabold transition-all duration-200',
                !isLogin
                  ? 'bg-gradient-to-r from-rose-600 to-red-700 text-white shadow-lg shadow-rose-600/20'
                  : 'text-slate-600 hover:text-slate-900',
              ].join(' ')}
              type="button"
            >
              <UserPlus className="w-5 h-5 inline-block mr-2" />
              Registrarse
            </button>
          </div>

          <div className="flex items-center gap-2 mb-4 px-1">
            <ShieldCheck className="w-4 h-4 text-rose-700" />
            <p className="text-sm text-slate-600">
              {isLogin ? 'Acceso administrativo' : 'Crea una cuenta para administrar planillas'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="label flex items-center gap-2">
                  <User className="w-4 h-4 text-rose-700" />
                  Nombre completo
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="input pl-12"
                    placeholder="Juan Pérez García"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required={!isLogin}
                  />
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                </div>
              </div>
            )}

            <div>
              <label className="label flex items-center gap-2">
                <Mail className="w-4 h-4 text-rose-700" />
                Correo electrónico
              </label>
              <div className="relative">
                <input
                  type="email"
                  className="input pl-12"
                  placeholder="correo@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="label flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-700" />
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pl-12 pr-12"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-700"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300" />
                  <span className="text-slate-600">Mantener sesión</span>
                </label>
                <button type="button" className="text-rose-700 hover:text-rose-800 font-semibold">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            <button type="submit" className="btn-primary w-full py-4 text-base">
              {isLogin ? 'Acceder al sistema' : 'Crear cuenta'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-500 text-sm">
              {isLogin ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-rose-700 hover:text-rose-800 font-extrabold ml-1"
                type="button"
              >
                {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-400 text-sm mt-6">
          © {new Date().getFullYear()} UGELAA - Todos los derechos reservados
        </p>
      </div>
    </div>
  )
}