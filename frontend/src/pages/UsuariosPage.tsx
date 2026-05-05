import { useState } from 'react';
import { Button, Input, Modal } from '../components';
import { useAuth } from '../hooks/useAuth';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  created_at: string;
}

interface CreateUserRequest {
  email: string;
  password: string;
  nombre: string;
}

export function UsuariosPage() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<CreateUserRequest>({ email: '', password: '', nombre: '' });
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/users`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setUsuarios(data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  if (usuarios.length === 0 && !loading) {
    fetchUsers();
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setCreating(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al crear usuario');
      }
      setIsModalOpen(false);
      setFormData({ email: '', password: '', nombre: '' });
      fetchUsers();
    } catch (err) {
      setFormError((err as Error).message);
    }
    setCreating(false);
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative flex flex-col md:flex-row md:justify-between md:items-center gap-6">
          <div className="animate-fadeIn">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold">Usuarios</h1>
                <p className="text-slate-400 text-sm">Gestiona los usuarios del sistema</p>
              </div>
            </div>
          </div>
          
          <div className="animate-fadeIn stagger-1">
            <Button 
              onClick={() => setIsModalOpen(true)} 
              className="bg-violet-500 hover:bg-violet-400 shadow-lg shadow-violet-500/30"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              Nuevo Usuario
            </Button>
          </div>
        </div>

        <div className="relative mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Total Usuarios</p>
            <p className="text-2xl font-bold text-white">{usuarios.length}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Activos</p>
            <p className="text-2xl font-bold text-violet-400">{usuarios.length}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Tu Rol</p>
            <p className="text-2xl font-bold text-emerald-400">Admin</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-6 p-5 border-b border-slate-100">
              <div className="skeleton h-5 w-32" />
              <div className="skeleton h-5 w-48" />
              <div className="skeleton h-5 w-32 ml-auto" />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm animate-fadeIn">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Usuario</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha Creación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuarios.map((u, i) => (
                  <tr key={u.id} className="hover:bg-violet-50/30 transition-all duration-200 animate-fadeIn" style={{ animationDelay: `${i * 0.03}s` }}>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg">{u.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-violet-400 to-violet-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {u.nombre.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-slate-700">{u.nombre}</span>
                        {u.id === user?.id && (
                          <span className="ml-2 px-2 py-0.5 bg-violet-100 text-violet-700 text-xs rounded-full font-medium">Tú</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{u.email}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-400">{new Date(u.created_at).toLocaleDateString('es-PE')}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo Usuario" size="md"
        footer={<><Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button><Button onClick={handleSubmit} loading={creating}>Crear</Button></>}>
        <div className="p-4 bg-violet-50 rounded-xl border border-violet-100 mb-4">
          <p className="text-sm text-violet-700 font-medium">Crear nuevo usuario del sistema</p>
          <p className="text-xs text-violet-500 mt-1">El usuario podrá acceder al sistema con las credenciales que proporciones.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nombre" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} placeholder="Juan Pérez" required />
          <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="juan@empresa.com" required />
          <Input label="Contraseña" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Mínimo 6 caracteres" required />
          {formError && <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{formError}</div>}
        </form>
      </Modal>
    </div>
  );
}