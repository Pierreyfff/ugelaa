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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="animate-fadeIn">
          <h1 className="text-3xl font-bold text-slate-800">Usuarios</h1>
          <p className="text-slate-500 mt-1">Gestiona los usuarios del sistema</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        }>
          Nuevo Usuario
        </Button>
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
          <table className="w-full">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">ID</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Nombre</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Email</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Creado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuarios.map((u, i) => (
                <tr key={u.id} className="hover:bg-sky-50/30 transition-colors animate-fadeIn" style={{ animationDelay: `${i * 0.05}s` }}>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-slate-800">{u.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-700">{u.nombre}</span>
                    {u.id === user?.id && (
                      <span className="ml-2 px-2 py-0.5 bg-sky-100 text-sky-700 text-xs rounded-full">Tú</span>
                    )}
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
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nuevo Usuario" size="md"
        footer={<><Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button><Button onClick={handleSubmit} loading={creating}>Crear</Button></>}>
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