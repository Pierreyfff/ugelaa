import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button, Input } from '../components';

export function LoginPage() {
  const { login, isLoading, error, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [localError, setLocalError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      window.location.reload();
    }
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    try {
      await login(email, password, rememberMe);
    } catch (err) {
      setLocalError((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen flex gradient-mesh relative overflow-hidden">
      <div className="blob w-[500px] h-[500px] bg-sky-500/20 rounded-full top-0 left-0" style={{ animationDelay: '0s' }} />
      <div className="blob w-[400px] h-[400px] bg-violet-500/15 rounded-full bottom-1/4 right-0" style={{ animationDelay: '5s' }} />
      <div className="blob w-[300px] h-[300px] bg-emerald-500/10 rounded-full top-1/2 left-1/4" style={{ animationDelay: '10s' }} />
      <div className="blob w-[250px] h-[250px] bg-amber-500/10 rounded-full bottom-0 right-1/4" style={{ animationDelay: '15s' }} />

      <div className="hidden lg:flex lg:w-1/2 relative z-10 p-12 items-center justify-center">
        <div className={`max-w-lg transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex items-center gap-4 mb-12">
            <div className="w-18 h-18 p-1 rounded-3xl bg-gradient-to-br from-sky-400 via-emerald-400 to-violet-500">
              <div className="w-full h-full bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Nómina</h1>
              <p className="text-sky-300 font-medium">Sistema de Planillas</p>
            </div>
          </div>

          <h2 className="text-6xl font-bold text-white mb-6 leading-tight">
            Gestión<br />
            <span className="bg-gradient-to-r from-sky-400 to-emerald-400 bg-clip-text text-transparent">Inteligente</span><br />
            de Nómina
          </h2>
          
          <p className="text-slate-300 text-lg mb-12 leading-relaxed max-w-md">
            Administra tu personal, calcula nóminas y gestiona pagos de manera eficiente, segura y moderna.
          </p>

          <div className="space-y-5">
            {[
              { icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', text: 'Registro completo de trabajadores' },
              { icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z', text: 'Cálculo automático de nómina' },
              { icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', text: 'Seguridad de nivel empresarial' },
              { icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12', text: 'Importación y exportación Excel' },
            ].map((feature, i) => (
              <div key={i} className={`flex items-center gap-4 text-slate-300 transition-all duration-500 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`} style={{ transitionDelay: `${200 + i * 100}ms` }}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-emerald-500/20 flex items-center justify-center border border-sky-500/20">
                  <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={feature.icon} />
                  </svg>
                </div>
                <span className="text-sm font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
        <div className={`w-full max-w-md transition-all duration-700 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <div className="lg:hidden mb-10 text-center">
            <div className="inline-flex items-center gap-3 mb-2">
              <div className="w-14 h-14 p-1 rounded-2xl bg-gradient-to-br from-sky-400 via-emerald-400 to-violet-500">
                <div className="w-full h-full bg-white/10 backdrop-blur-xl rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-white">Nómina</h1>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 border border-white/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-400 via-emerald-400 to-violet-500" />
            
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-sky-100 to-emerald-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Bienvenido de nuevo</h2>
              <p className="text-slate-500">Ingresa tus credenciales para continuar</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Input
                  label="Correo electrónico"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@empresa.com"
                  required
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  }
                />
              </div>

              <div>
                <Input
                  label="Contraseña"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-sky-500 rounded border-slate-300 focus:ring-sky-500"
                  />
                  <span className="text-sm text-slate-600">
                    Recordarme por <span className="font-semibold text-sky-600">15 días</span>
                  </span>
                </label>
              </div>

              {(error || localError) && (
                <div className="p-4 bg-red-50/80 backdrop-blur-sm border border-red-100 rounded-xl flex items-start gap-3 animate-fadeIn">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-red-600 font-medium">Error de autenticación</p>
                    <p className="text-xs text-red-500 mt-0.5">{error || localError}</p>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full py-3.5 text-base mt-2" loading={isLoading}>
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>
          </div>

          <div className="mt-8 text-center animate-fadeIn" style={{ animationDelay: '0.5s' }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <p className="text-slate-400 text-sm">Credenciales de demostración</p>
            </div>
            <p className="text-slate-300 font-medium mt-2">admin@gnial.com / admin123</p>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">© 2024 Sistema de Nómina. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    </div>
  );
}