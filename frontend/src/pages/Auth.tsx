import { useState } from 'react'
import { useAuth } from '../App'
import { AlertCircle, Eye, EyeOff, Loader2, CheckCircle, ChevronRight, Lock, Mail, User, Sparkles, Shield, Zap, FileSpreadsheet } from 'lucide-react'
import api from '../services/api'

export default function Auth() {
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [step, setStep] = useState<'form' | 'loading' | 'success'>('form')
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const validateForm = () => {
    const errors: { email?: string; password?: string } = {}
    if (!formData.email.trim()) errors.email = 'El correo es requerido'
    else if (!validateEmail(formData.email)) errors.email = 'Correo inválido'
    if (!formData.password) errors.password = 'La contraseña es requerida'
    else if (formData.password.length < 4) errors.password = 'Mínimo 4 caracteres'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!validateForm()) return

    setStep('loading')
    setIsLoading(true)

    try {
      const response = await api.post('/api/usuarios/login', { email: formData.email, password: formData.password })
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token)
        localStorage.setItem('user_data', JSON.stringify(response.data.user || {}))
        setStep('success')
        setTimeout(() => login(), 1200)
      }
    } catch (err: any) {
      setStep('form')
      setError(err.response?.data?.error || 'Credenciales incorrectas. Intenta de nuevo.')
    } finally { setIsLoading(false) }
  }

  const handleDemoLogin = () => {
    setFormData({ email: 'admin@planillas.su', password: 'admin123' })
    setError('')
  }

  if (step === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="relative z-10 text-center max-w-md w-full px-6">
          <div className="w-32 h-32 rounded-3xl bg-red-600 flex items-center justify-center shadow-2xl mx-auto mb-8">
            <FileSpreadsheet className="w-16 h-16 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Verificando acceso</h2>
          <p className="text-gray-400 mb-8">Validando credenciales de usuario</p>
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
            <span className="text-red-500 font-medium">Por favor espera</span>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="relative z-10 text-center max-w-md w-full px-6">
          <div className="w-32 h-32 rounded-3xl bg-green-500 flex items-center justify-center shadow-2xl mx-auto mb-8">
            <CheckCircle className="w-16 h-16 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">¡Bienvenido!</h2>
          <p className="text-green-400">Acceso concedido. Redirigiendo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[55%] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-red-500/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-20%] right-1/4 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[120px]"></div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center p-16 w-full max-w-2xl mx-auto">
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center shadow-2xl">
                <FileSpreadsheet className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold text-white tracking-tight">Planillas<span className="text-red-500">SU</span></h1>
                <p className="text-xl text-gray-400 font-light">Sistema de Gestión de Nómina</p>
              </div>
            </div>
            <p className="text-gray-400 text-lg leading-relaxed max-w-lg">
              Administra tu personal, planillas y pagos de manera eficiente y segura
            </p>
          </div>

          <div className="space-y-5">
            {[
              { icon: Zap, title: 'Gestión Integral', desc: 'Administra personal, planillas y pagos en un solo lugar', color: 'from-red-600 to-red-700' },
              { icon: FileSpreadsheet, title: 'Importación Masiva', desc: 'Importa datos desde Excel de forma rápida y segura', color: 'from-gray-600 to-gray-700' },
              { icon: Shield, title: 'Reportes Detallados', desc: 'Genera reportes y estadísticas en tiempo real', color: 'from-gray-500 to-gray-600' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-5 p-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-white/10 transition-all group">
                <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <div className="pt-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-gray-400 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 flex items-center gap-6">
            <div className="flex -space-x-3">
              {[1,2,3].map(i => (
                <div key={i} className={`w-10 h-10 rounded-full border-2 border-gray-900 bg-gradient-to-br ${i===1?'from-red-500 to-red-600':i===2?'from-gray-500 to-gray-600':'from-gray-400 to-gray-500'} flex items-center justify-center`}>
                  <span className="text-white text-xs font-bold">{['A','B','C'][i-1]}</span>
                </div>
              ))}
            </div>
            <p className="text-gray-500 text-sm">Únete a +150 usuarios que confían en PlanillasSU</p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[45%] flex items-center justify-center p-8 bg-gray-50">
        <div className="relative z-10 w-full max-w-md">
          <div className="lg:hidden text-center mb-10">
            <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center shadow-xl mx-auto mb-4">
              <FileSpreadsheet className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Planillas<span className="text-red-600">SU</span></h1>
            <p className="text-gray-500 mt-2">Sistema de Gestión de Nómina</p>
          </div>

          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Bienvenido de nuevo</h2>
            <p className="text-gray-500">Ingresa tus credenciales para acceder al sistema</p>
          </div>

          {error && (
            <div className="mb-8 p-5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <span className="text-red-700 font-medium flex-1">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2.5 ml-1">Correo electrónico</label>
              <div className="relative">
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${focusedField === 'email' ? 'bg-red-600 shadow-lg' : 'bg-gray-100'}`}>
                  <Mail className={`w-5 h-5 transition-colors ${focusedField === 'email' ? 'text-white' : 'text-gray-400'}`} />
                </div>
                <input
                  type="email"
                  className={`w-full pl-16 pr-5 py-4 bg-white border-2 ${fieldErrors.email ? 'border-red-300 bg-red-50' : focusedField === 'email' ? 'border-red-400 bg-white shadow-lg' : 'border-gray-200 bg-gray-50'} rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none transition-all text-base`}
                  placeholder="correo@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setFieldErrors({ ...fieldErrors, email: undefined }); setError('') }}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </div>
              {fieldErrors.email && <p className="mt-2.5 text-sm text-red-600 font-medium ml-1">{fieldErrors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2.5 ml-1">Contraseña</label>
              <div className="relative">
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${focusedField === 'password' ? 'bg-red-600 shadow-lg' : 'bg-gray-100'}`}>
                  <Lock className={`w-5 h-5 transition-colors ${focusedField === 'password' ? 'text-white' : 'text-gray-400'}`} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`w-full pl-16 pr-16 py-4 bg-white border-2 ${fieldErrors.password ? 'border-red-300 bg-red-50' : focusedField === 'password' ? 'border-red-400 bg-white shadow-lg' : 'border-gray-200 bg-gray-50'} rounded-2xl text-gray-800 placeholder-gray-400 focus:outline-none transition-all text-base`}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setFieldErrors({ ...fieldErrors, password: undefined }); setError('') }}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600 transition-colors p-1.5 hover:bg-red-50 rounded-lg">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {fieldErrors.password && <p className="mt-2.5 text-sm text-red-600 font-medium ml-1">{fieldErrors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-xl shadow-red-600/25 hover:shadow-red-600/40 transition-all duration-300 flex items-center justify-center gap-3 text-base disabled:opacity-60 disabled:cursor-not-allowed group"
            >
              {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /><span>Verificando...</span></> : <><span>Iniciar Sesión</span><ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
            </button>
          </form>

          <div className="mt-8 p-6 bg-gray-100 rounded-2xl border border-gray-200">
            <p className="text-sm text-gray-500 font-medium text-center mb-4">¿No tienes acceso? Contacta al administrador</p>
            <button onClick={handleDemoLogin} className="w-full py-3.5 bg-white border-2 border-gray-200 hover:border-red-400 hover:bg-red-50 text-gray-700 font-semibold rounded-xl transition-all duration-300 text-sm flex items-center justify-center gap-2 group hover:shadow-lg">
              <User className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Usar credenciales de prueba</span>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center gap-2 text-gray-400">
              <Sparkles className="w-4 h-4" />
              <p className="text-center text-sm">© {new Date().getFullYear()} Planillas SU — Todos los derechos reservados</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}