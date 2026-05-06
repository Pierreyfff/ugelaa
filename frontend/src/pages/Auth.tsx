import { useState } from 'react'
import { LogIn, UserPlus, Mail, Lock, User, Eye, EyeOff, FileSpreadsheet } from 'lucide-react'

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
    console.log('Auth submit:', formData)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-sky-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-sky-400 via-blue-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-sky-500/30">
            <FileSpreadsheet className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Sistema de Planillas</h1>
          <p className="text-slate-500 mt-2">Gestión de personal y nóminas</p>
        </div>

        <div className="card shadow-2xl border-2 border-sky-100">
          <div className="flex rounded-2xl bg-slate-100 p-1 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all duration-300 ${
                isLogin
                  ? 'bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-lg'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <LogIn className="w-5 h-5 inline-block mr-2" />
              Iniciar Sesión
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all duration-300 ${
                !isLogin
                  ? 'bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-lg'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <UserPlus className="w-5 h-5 inline-block mr-2" />
              Registrarse
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="label flex items-center gap-2">
                  <User className="w-4 h-4 text-sky-500" />
                  Nombre Completo
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
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sky-400" />
                </div>
              </div>
            )}

            <div>
              <label className="label flex items-center gap-2">
                <Mail className="w-4 h-4 text-sky-500" />
                Correo Electrónico
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
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sky-400" />
              </div>
            </div>

            <div>
              <label className="label flex items-center gap-2">
                <Lock className="w-4 h-4 text-sky-500" />
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
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-sky-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-500"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-sky-500 focus:ring-sky-500" />
                  <span className="text-slate-600">Recordarme</span>
                </label>
                <a href="#" className="text-sky-600 hover:text-sky-700 font-medium">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full py-4 text-lg"
            >
              {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-500 text-sm">
              {isLogin ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-sky-600 hover:text-sky-700 font-bold ml-1"
              >
                {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-400 text-sm mt-6">
          © 2024 Sistema de Planillas - Todos los derechos reservados
        </p>
      </div>
    </div>
  )
}