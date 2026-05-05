import { useState } from 'react';
import { usePersonal } from '../hooks/usePersonal';
import { Button, Input, Modal, Pagination, ImportExcel } from '../components';
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
    importMany,
  } = usePersonal();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
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

  const handleImport = async (data: CreatePersonalRequest[], mode: 'create' | 'upsert') => {
    await importMany(data, mode);
    setIsImportModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative flex flex-col md:flex-row md:justify-between md:items-center gap-6">
          <div className="animate-fadeIn">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold">Personal</h1>
                <p className="text-slate-400 text-sm">Gestiona los trabajadores registrados</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 animate-fadeIn stagger-1">
            <div className="relative group">
              <Button 
                onClick={() => setIsImportModalOpen(true)}
                variant="secondary"
                className="bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                }
              >
                Importar Excel
              </Button>
              <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800 rounded-xl border border-slate-700 p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl">
                <p className="text-xs text-slate-300 font-medium mb-2">Opciones de importación:</p>
                <ul className="text-xs text-slate-400 space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                    Solo crear nuevos registros
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-sky-400 rounded-full"></span>
                    Crear o actualizar (Upsert)
                  </li>
                </ul>
              </div>
            </div>
            <Button 
              onClick={openCreate} 
              className="bg-sky-500 hover:bg-sky-400 shadow-lg shadow-sky-500/30"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              Agregar Trabajador
            </Button>
          </div>
        </div>

        <div className="relative mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Total Registrados</p>
            <p className="text-2xl font-bold text-white">{total}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Activos</p>
            <p className="text-2xl font-bold text-emerald-400">{personal.filter(p => p.activo).length}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Inactivos</p>
            <p className="text-2xl font-bold text-red-400">{personal.filter(p => !p.activo).length}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">En Esta Página</p>
            <p className="text-2xl font-bold text-sky-400">{personal.length}</p>
          </div>
        </div>
      </div>

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
            {query ? 'No se encontraron resultados' : 'No hay trabajadores registrados'}
          </p>
          <p className="text-slate-400 text-sm mt-2">
            {query ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando un nuevo trabajador o importa desde Excel'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm animate-fadeIn stagger-3">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-50 to-slate-100/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">DNI</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nombres</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Apellidos</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Puesto</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">RD / UU</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {personal.map((p, i) => (
                    <tr key={p.id} className="hover:bg-sky-50/30 transition-all duration-200 animate-fadeIn" style={{ animationDelay: `${i * 0.03}s` }}>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg font-mono">{p.dni}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {p.nombres.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-slate-700">{p.nombres}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-700">{p.apellidos}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-500">{p.puesto || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {p.rd && <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-md font-medium">{p.rd}</span>}
                          {p.uu && <span className="text-xs bg-violet-100 text-violet-600 px-2 py-1 rounded-md font-medium">{p.uu}</span>}
                          {!p.rd && !p.uu && <span className="text-sm text-slate-400">-</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${p.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${p.activo ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                          {p.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(p)}
                            className="p-2.5 text-sky-600 hover:bg-sky-50 rounded-xl transition-all hover:scale-110"
                            title="Editar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(p.id)}
                            className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all hover:scale-110"
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
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center pt-4">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={changePage} />
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPersonal ? 'Editar Trabajador' : 'Nuevo Trabajador'}
        size="lg"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Input
                label="DNI"
                value={formData.dni}
                onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                placeholder="12345678"
                required
              />
            </div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Importar Personal desde Excel"
        size="lg"
        footer={
          <Button variant="ghost" onClick={() => setIsImportModalOpen(false)}>Cerrar</Button>
        }
      >
        <div className="mb-4 p-4 bg-sky-50 rounded-xl border border-sky-100">
          <p className="text-sm text-sky-700 font-medium mb-2">Formato esperado del Excel:</p>
          <div className="flex gap-4 text-xs text-sky-600">
            <span className="bg-white px-2 py-1 rounded">DNI</span>
            <span className="bg-white px-2 py-1 rounded">Nombres</span>
            <span className="bg-white px-2 py-1 rounded">Apellidos</span>
            <span className="bg-white px-2 py-1 rounded">Puesto</span>
            <span className="bg-white px-2 py-1 rounded">RD</span>
            <span className="bg-white px-2 py-1 rounded">UU</span>
          </div>
        </div>
        <ImportExcel onImport={handleImport} />
      </Modal>

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
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-slate-600">¿Estás seguro de que deseas eliminar este registro?</p>
            <p className="text-sm text-slate-400 mt-1">Esta acción no se puede deshacer.</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}