import { useState } from 'react';
import { usePersonal } from '../hooks/usePersonal';
import { Button, Input, Modal, Pagination } from '../components';
import { CreatePersonalRequest, Personal } from '../types';

export function PersonalPage() {
  const {
    personal,
    total,
    page,
    loading,
    error,
    query,
    handleQueryChange,
    changePage,
    create,
    update,
    remove,
  } = usePersonal();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPersonal, setEditingPersonal] = useState<Personal | null>(null);
  const [formData, setFormData] = useState<CreatePersonalRequest>({
    dni: '',
    nombres: '',
    apellidos: '',
    puesto: '',
    rd: '',
    uu: '',
  });
  const [formError, setFormError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const totalPages = Math.ceil(total / 20);

  const openCreate = () => {
    setEditingPersonal(null);
    setFormData({ dni: '', nombres: '', apellidos: '', puesto: '', rd: '', uu: '' });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEdit = (p: Personal) => {
    setEditingPersonal(p);
    setFormData({
      dni: p.dni,
      nombres: p.nombres,
      apellidos: p.apellidos,
      puesto: p.puesto || '',
      rd: p.rd || '',
      uu: p.uu || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      if (editingPersonal) {
        await update(editingPersonal.id, formData);
      } else {
        await create(formData);
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError((err as Error).message);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await remove(id);
      setDeleteConfirm(null);
    } catch (err) {
      setFormError((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="animate-fadeIn">
          <h1 className="text-3xl font-bold text-slate-800">Personal</h1>
          <p className="text-slate-500 mt-1">Gestiona los trabajadores registrados</p>
        </div>
        <Button onClick={openCreate} className="animate-fadeIn stagger-1" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        }>
          Agregar Trabajador
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 animate-fadeIn stagger-2">
        <div className="relative">
          <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre completo o DNI..."
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="w-full pl-14 pr-5 py-3.5 bg-slate-50 border-2 border-transparent rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-sky-400 focus:shadow-lg focus:shadow-sky-500/10 transition-all"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-5 bg-red-50/80 backdrop-blur-sm border border-red-100 rounded-2xl flex items-center gap-4 animate-fadeIn">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-6 p-5 border-b border-slate-100">
              <div className="skeleton h-5 w-28" />
              <div className="skeleton h-5 w-36" />
              <div className="skeleton h-5 w-36" />
              <div className="skeleton h-5 w-28" />
              <div className="skeleton h-8 w-24 ml-auto" />
            </div>
          ))}
        </div>
      ) : personal.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-16 text-center animate-fadeIn">
          <div className="w-20 h-20 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <p className="text-slate-500 font-medium text-lg">
            {query ? 'No se encontraron resultados' : 'Ingresa un término de búsqueda'}
          </p>
          <p className="text-slate-400 text-sm mt-2">Escribe al menos 2 caracteres para buscar</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm animate-fadeIn stagger-3">
            <table className="w-full">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">DNI</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nombres</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Apellidos</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Puesto</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {personal.map((p, i) => (
                  <tr key={p.id} className="hover:bg-sky-50/30 transition-colors animate-fadeIn" style={{ animationDelay: `${i * 0.05}s` }}>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg">{p.dni}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-700">{p.nombres}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-700">{p.apellidos}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-500">{p.puesto || '-'}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${p.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-2.5 text-sky-600 hover:bg-sky-50 rounded-xl transition-colors"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(p.id)}
                          className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          title="Eliminar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center pt-4">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={changePage} />
            </div>
          )}
        </>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPersonal ? 'Editar Trabajador' : 'Nuevo Trabajador'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={() => document.getElementById('personal-form')?.dispatchEvent(new Event('submit', { bubbles: true }))}>
              {editingPersonal ? 'Guardar Cambios' : 'Crear'}
            </Button>
          </>
        }
      >
        <form id="personal-form" onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="DNI"
              value={formData.dni}
              onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
              placeholder="12345678"
              required
            />
            <Input
              label="Nombres"
              value={formData.nombres}
              onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
              placeholder="Juan Carlos"
              required
            />
          </div>
          <Input
            label="Apellidos"
            value={formData.apellidos}
            onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
            placeholder="Pérez García"
            required
          />
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Puesto"
              value={formData.puesto}
              onChange={(e) => setFormData({ ...formData, puesto: e.target.value })}
              placeholder="Analista"
            />
            <Input
              label="RD"
              value={formData.rd}
              onChange={(e) => setFormData({ ...formData, rd: e.target.value })}
              placeholder="RD-001"
            />
            <Input
              label="UU"
              value={formData.uu}
              onChange={(e) => setFormData({ ...formData, uu: e.target.value })}
              placeholder="UU-001"
            />
          </div>
          {formError && <p className="text-sm font-medium text-red-500 p-3 bg-red-50 rounded-xl">{formError}</p>}
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title="Confirmar Eliminación"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button variant="danger" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Eliminar</Button>
          </>
        }
      >
        <p className="text-slate-600">¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.</p>
      </Modal>
    </div>
  );
}