import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button, Input } from '../components';

export function LoginPage() {
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    try {
      await login(email, password);
    } catch (err) {
      setLocalError((err as Error).message);
    }
  };

  return (
    <div className="min-h-screen flex gradient-mesh relative overflow-hidden">
      {/* Animated Blobs */}
      <div className="blob w-96 h-96 bg-sky-500/20 rounded-full top-0 left-0" style={{ animationDelay: '0s' }} />
      <div className="blob w-80 h-80 bg-sky-400/15 rounded-full bottom-1/4 right-0" style={{ animationDelay: '5s' }} />
      <div className="blob w-64 h-64 bg-purple-500/10 rounded-full top-1/2 left-1/4" style={{ animationDelay: '10s' }} />

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 p-12 items-center justify-center">
        <div className="max-w-lg">
          <div className="flex items-center gap-4 mb-10 animate-fadeIn">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl">
              <svg className="w-9 h-9 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Nómina</h1>
              <p className="text-sky-300 text-sm font-medium">Sistema de Planillas</p>
            </div>
          </div>

          <h2 className="text-5xl font-bold text-white mb-6 leading-tight animate-fadeIn stagger-1">
            Gestión<br />Inteligente<br /><span className="text-sky-400">de Nómina</span>
          </h2>
          
          <p className="text-slate-300 text-lg mb-10 leading-relaxed animate-fadeIn stagger-2">
            Administra tu personal, calcula nóminas y gestiona pagos de manera eficiente, segura y moderna.
          </p>

          <div className="space-y-4 animate-fadeIn stagger-3">
            {[
              'Registro completo de trabajadores',
              'Cálculo automático de haberes y descuentos',
              'Seguridad de nivel empresarial'
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-slate-300">
                <div className="w-6 h-6 rounded-full bg-sky-500/20 flex items-center justify-center">
                  <svg className="w-3 h-3 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center animate-fadeIn">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
                <svg className="w-7 h-7 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white">Nómina</h1>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 border border-white/20 animate-fadeIn stagger-2">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Bienvenido de nuevo</h2>
              <p className="text-slate-500">Ingresa tus credenciales para continuar</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <Input
                  label="Correo electrónico"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@empresa.com"
                  required
                />
              </div>

              <div className="space-y-1">
                <Input
                  label="Contraseña"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                />
              </div>

              {(error || localError) && (
                <div className="p-4 bg-red-50/80 backdrop-blur-sm border border-red-100 rounded-xl flex items-start gap-3 animate-fadeIn">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-red-600">{error || localError}</p>
                </div>
              )}

              <Button type="submit" className="w-full py-3.5 text-base mt-2" loading={isLoading}>
                Iniciar Sesión
              </Button>
            </form>
          </div>

          <div className="mt-6 text-center animate-fadeIn stagger-4">
            <p className="text-slate-400 text-sm">Credenciales de demostración</p>
            <p className="text-slate-300 font-medium">admin@gnial.com / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}