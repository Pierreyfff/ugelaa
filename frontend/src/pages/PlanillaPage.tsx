import { useState, useEffect } from 'react';
import { usePlanilla } from '../hooks/usePlanilla';
import { usePersonal } from '../hooks/usePersonal';
import { Button, Input, Select, Modal, Pagination } from '../components';
import { Planilla, CreatePlanillaRequest, Ingreso, Descuento, Personal, CreatePersonalRequest } from '../types';
import { personalApi } from '../api/personal';
import { planillaApi } from '../api/planilla';

const INGRESO_TIPOS = [
  'Sueldo Base', 'Bonificación', 'Horas Extras', 'Asignación Familiar',
  'Movilidad', 'Viáticos', 'Otro Ingreso'
];

const DESCUENTO_TIPOS = [
  'AFP', 'ESSALUD', 'Impuesto', 'Faltas', 'Tardanzas', 'Otro Descuento'
];

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export function PlanillaPage() {
  const { planillas, total, page, loading, error, list, create, update, remove, prefill } = usePlanilla();
  const { personal: allPersonal, search: searchPersonal, handleQueryChange, query } = usePersonal();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlanilla, setEditingPlanilla] = useState<Planilla | null>(null);
  const [selectedPersonal, setSelectedPersonal] = useState<Personal | null>(null);
  const [showPersonalSearch, setShowPersonalSearch] = useState(false);
  const [formData, setFormData] = useState({
    mes: new Date().getMonth() + 1,
    anio: new Date().getFullYear(),
    ingresos: [{ tipo: '', monto: 0, comentario: '' }] as Ingreso[],
    descuentos: [{ tipo: '', monto: 0, comentario: '' }] as Descuento[],
  });
  const [formError, setFormError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [filterMes, setFilterMes] = useState<number>(0);
  const [filterAnio, setFilterAnio] = useState<number>(new Date().getFullYear());
  const [filterPersonalId, setFilterPersonalId] = useState<number | null>(null);
  const [isCreatePersonalOpen, setIsCreatePersonalOpen] = useState(false);
  const [newPersonalData, setNewPersonalData] = useState<CreatePersonalRequest>({ dni: '', nombres: '', apellidos: '', puesto: '', rd: '', uu: '' });
  const [newPersonalError, setNewPersonalError] = useState('');
  const [creatingPersonal, setCreatingPersonal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFilters, setExportFilters] = useState({ personal_id: 0, mes: new Date().getMonth() + 1, anio: new Date().getFullYear() });
  const [searchDNI, setSearchDNI] = useState('');
  const [foundPersonal, setFoundPersonal] = useState<Personal | null>(null);
  const [searchingPersonal, setSearchingPersonal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [personalPage, setPersonalPage] = useState(1);

  const totalPages = Math.ceil(total / 20);

  useEffect(() => {
    list({ personal_id: filterPersonalId || undefined, mes: filterMes || undefined, anio: filterAnio, limit: 20 });
  }, [filterMes, filterAnio, filterPersonalId, list]);

  const handlePersonalSelect = (p: Personal) => {
    setSelectedPersonal(p);
    setShowPersonalSearch(false);
    handleQueryChange('');
    prefill(p.id, formData.mes, formData.anio)
      .then((data) => {
        setFormData(prev => ({
          ...prev,
          ingresos: data.ingresos.length > 0 ? data.ingresos.map(i => ({ ...i, id: undefined })) : [{ tipo: '', monto: 0, comentario: '' }],
          descuentos: data.descuentos.length > 0 ? data.descuentos.map(d => ({ ...d, id: undefined })) : [{ tipo: '', monto: 0, comentario: '' }],
        }));
      })
      .catch(() => {
        setFormData(prev => ({
          ...prev,
          ingresos: [{ tipo: '', monto: 0, comentario: '' }],
          descuentos: [{ tipo: '', monto: 0, comentario: '' }],
        }));
      });
  };

  const openCreate = () => {
    setEditingPlanilla(null);
    setSelectedPersonal(null);
    setFormData({
      mes: new Date().getMonth() + 1,
      anio: new Date().getFullYear(),
      ingresos: [{ tipo: '', monto: 0, comentario: '' }],
      descuentos: [{ tipo: '', monto: 0, comentario: '' }],
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEdit = async (p: Planilla) => {
    const full = await list({ personal_id: p.personal_id, mes: p.mes, anio: p.anio, limit: 1 });
    if (!full || !full.data || full.data.length === 0) return;
    const planilla = full.data[0];
    setEditingPlanilla(planilla);
    setSelectedPersonal(planilla.personal || null);
    setFormData({
      mes: planilla.mes,
      anio: planilla.anio,
      ingresos: planilla.ingresos?.length ? planilla.ingresos : [{ tipo: '', monto: 0, comentario: '' }],
      descuentos: planilla.descuentos?.length ? planilla.descuentos : [{ tipo: '', monto: 0, comentario: '' }],
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const addIngreso = () => setFormData(prev => ({ ...prev, ingresos: [...prev.ingresos, { tipo: '', monto: 0, comentario: '' }] }));
  const removeIngreso = (i: number) => setFormData(prev => ({ ...prev, ingresos: prev.ingresos.filter((_, idx) => idx !== i) }));
  const updateIngreso = (i: number, f: keyof Ingreso, v: string | number) => setFormData(prev => ({ ...prev, ingresos: prev.ingresos.map((ing, idx) => idx === i ? { ...ing, [f]: v } : ing) }));

  const addDescuento = () => setFormData(prev => ({ ...prev, descuentos: [...prev.descuentos, { tipo: '', monto: 0, comentario: '' }] }));
  const removeDescuento = (i: number) => setFormData(prev => ({ ...prev, descuentos: prev.descuentos.filter((_, idx) => idx !== i) }));
  const updateDescuento = (i: number, f: keyof Descuento, v: string | number) => setFormData(prev => ({ ...prev, descuentos: prev.descuentos.map((d, idx) => idx === i ? { ...d, [f]: v } : d) }));

  const totalHaberes = formData.ingresos.reduce((s, i) => s + (Number(i.monto) || 0), 0);
  const totalDescuentos = formData.descuentos.reduce((s, d) => s + (Number(d.monto) || 0), 0);
  const totalLiquido = totalHaberes - totalDescuentos;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonal) return setFormError('Selecciona un trabajador');
    const ingresos = formData.ingresos.filter(i => i.tipo && i.monto > 0);
    const descuentos = formData.descuentos.filter(d => d.tipo && d.monto > 0);
    try {
      if (editingPlanilla) await update(editingPlanilla.id, { ingresos, descuentos });
      else await create({ personal_id: selectedPersonal.id, mes: formData.mes, anio: formData.anio, ingresos, descuentos });
      setIsModalOpen(false);
      list({ mes: filterMes || undefined, anio: filterAnio, limit: 20 });
    } catch (err) { setFormError((err as Error).message); }
  };

  const handleDelete = async (id: number) => { await remove(id); setDeleteConfirm(null); };
  const formatMonto = (m: number) => m.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' });

  const handleCreatePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewPersonalError('');
    setCreatingPersonal(true);
    try {
      const created = await personalApi.create(newPersonalData);
      setIsCreatePersonalOpen(false);
      setNewPersonalData({ dni: '', nombres: '', apellidos: '', puesto: '', rd: '', uu: '' });
      setSelectedPersonal(created);
      searchPersonal('');
    } catch (err) { setNewPersonalError((err as Error).message); }
    finally { setCreatingPersonal(false); }
  };

const handleSearchByDNI = async () => {
    if (!searchDNI.trim()) return;
    setSearchingPersonal(true);
    try {
      const data = await personalApi.getByDNI(searchDNI);
      setFoundPersonal(data);
    } catch { setFoundPersonal(null); }
    finally { setSearchingPersonal(false); }
  };

  const handleSearchPersonalList = async () => {
    setSearchingPersonal(true);
    try {
      const res = await personalApi.search(searchQuery, personalPage, 10);
      if (res.data && res.data.length > 0) {
        setFoundPersonal(res.data[0]);
      }
    } catch { }
    finally { setSearchingPersonal(false); }
  };

  const handleSelectPersonal = (p: Personal) => {
    setFoundPersonal(p);
    setSearchDNI(p.dni);
  };

  const handleExport = async () => {
    if (!foundPersonal) return alert('Busca un trabajador por DNI');
    setExporting(true);
    try {
      const blob = await planillaApi.exportExcel({
        personal_id: foundPersonal.id,
        mes: exportFilters.mes,
        anio: exportFilters.anio,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Boleta_${foundPersonal.apellidos}_${foundPersonal.nombres}_${MESES[exportFilters.mes - 1]}_${exportFilters.anio}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setShowExportModal(false);
    } catch (err) { alert('Error al exportar'); }
    finally { setExporting(false); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="animate-fadeIn">
          <h1 className="text-3xl font-bold text-slate-800">Planillas</h1>
          <p className="text-slate-500 mt-1">Gestiona las nóminas de los trabajadores</p>
        </div>
        <Button onClick={openCreate} className="animate-fadeIn stagger-1" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        }>
          Nueva Planilla
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 animate-fadeIn stagger-2">
        <div className="flex flex-wrap gap-4 items-center">
          <Select
            value={filterPersonalId || ''} onChange={(e) => setFilterPersonalId(e.target.value ? Number(e.target.value) : null)}
            options={[{ value: '', label: 'Todos los trabajadores' }, ...allPersonal.map(p => ({ value: p.id, label: `${p.apellidos}, ${p.nombres}` }))]}
            className="w-56"
          />
          <Select
            value={filterMes} onChange={(e) => setFilterMes(Number(e.target.value))}
            options={[{ value: 0, label: 'Todos los meses' }, ...MESES.map((m, i) => ({ value: i + 1, label: m }))]}
            className="w-48"
          />
          <Select
            value={filterAnio} onChange={(e) => setFilterAnio(Number(e.target.value))}
            options={Array.from({ length: 5 }, (_, i) => ({ value: 2022 + i, label: String(2022 + i) }))}
            className="w-36"
          />
          <Button onClick={() => setShowExportModal(true)} variant="secondary" icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }>
            Exportar Excel
          </Button>
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
              <div className="skeleton h-5 w-44" />
              <div className="skeleton h-5 w-24" />
              <div className="skeleton h-5 w-32 ml-auto" />
              <div className="skeleton h-5 w-32" />
              <div className="skeleton h-5 w-32" />
            </div>
          ))}
        </div>
      ) : planillas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-16 text-center animate-fadeIn">
          <div className="w-20 h-20 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-slate-500 font-medium text-lg">No hay planillas registradas</p>
          <p className="text-slate-400 text-sm mt-2">Crea una nueva planilla para comenzar</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm animate-fadeIn stagger-3">
            <table className="w-full">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Trabajador</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Periodo</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Haberes</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Descuentos</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Líquido</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {planillas.map((p, i) => (
                  <tr key={p.id} className="hover:bg-sky-50/30 transition-colors animate-fadeIn" style={{ animationDelay: `${i * 0.05}s` }}>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-slate-800">{p.personal ? `${p.personal.apellidos}, ${p.personal.nombres}` : `ID: ${p.personal_id}`}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">{MESES[p.mes - 1]} {p.anio}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-emerald-600">{formatMonto(p.total_haberes)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-red-500">{formatMonto(p.total_descuentos)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-sky-600 text-lg">{formatMonto(p.total_liquido)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(p)} className="p-2.5 text-sky-600 hover:bg-sky-50 rounded-xl" title="Editar">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => setDeleteConfirm(p.id)} className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl" title="Eliminar">
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
          {totalPages > 1 && <div className="flex justify-center pt-4"><Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => list({ mes: filterMes || undefined, anio: filterAnio, page: p, limit: 20 })} /></div>}
        </>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={editingPlanilla ? 'Editar Planilla' : 'Nueva Planilla'}
        size="xl"
        footer={<><Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button><Button onClick={handleSubmit}>{editingPlanilla ? 'Guardar' : 'Crear'}</Button></>}
      >
        <div className="space-y-6">
          {/* Personal */}
          {!editingPlanilla && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Trabajador</label>
              {selectedPersonal ? (
                <div className="flex items-center justify-between p-4 bg-sky-50 border border-sky-100 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center text-white font-bold">
                      {selectedPersonal.nombres.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{selectedPersonal.apellidos}, {selectedPersonal.nombres}</p>
                      <p className="text-sm text-slate-500">DNI: {selectedPersonal.dni}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setSelectedPersonal(null)} className="text-sm font-semibold text-sky-600 hover:text-sky-800">Cambiar</button>
                </div>
              ) : (
                <div className="relative">
                  <div className="flex gap-2">
                    <input
                      type="text" placeholder="Buscar trabajador por nombre o DNI..."
                      value={query} onChange={(e) => { handleQueryChange(e.target.value); setShowPersonalSearch(true); }}
                      onFocus={() => setShowPersonalSearch(true)}
                      className="flex-1 px-5 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-sky-400 transition-all"
                    />
                    <button type="button" onClick={() => setIsCreatePersonalOpen(true)} className="px-4 py-2 bg-sky-500 text-white rounded-xl font-semibold hover:bg-sky-600 transition-colors flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Nuevo
                    </button>
                  </div>
                  {showPersonalSearch && allPersonal.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-auto">
                      {allPersonal.map((p) => (
                        <button key={p.id} type="button" onClick={() => handlePersonalSelect(p)} className="w-full text-left px-4 py-3 hover:bg-sky-50 flex items-center gap-3">
                          <div className="w-9 h-9 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 font-semibold text-sm">{p.nombres.charAt(0)}</div>
                          <div><p className="font-medium text-slate-800">{p.apellidos}, {p.nombres}</p><p className="text-xs text-slate-500">{p.dni}</p></div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Periodo */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Mes</label>
              <div className="grid grid-cols-6 gap-2">
                {MESES.map((m, i) => (
                  <button key={m} type="button" onClick={() => setFormData({ ...formData, mes: i + 1 })}
                    className={`py-2.5 px-2 rounded-xl text-xs font-semibold transition-all ${
                      formData.mes === i + 1 ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}>{m.substring(0, 3)}</button>
                ))}
              </div>
            </div>
            <div className="w-32">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Año</label>
              <Select value={formData.anio} onChange={(e) => setFormData({ ...formData, anio: Number(e.target.value) })}
                options={Array.from({ length: 5 }, (_, i) => ({ value: 2022 + i, label: String(2022 + i) }))} />
            </div>
          </div>

          {/* Ingresos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-slate-700">Ingresos</label>
              <button type="button" onClick={addIngreso} className="text-sm font-semibold text-sky-600 hover:text-sky-800 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Agregar
              </button>
            </div>
            <div className="space-y-2">
              {formData.ingresos.map((ing, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <Select value={ing.tipo} onChange={(e) => updateIngreso(i, 'tipo', e.target.value)}
                    options={[{ value: '', label: 'Seleccionar...' }, ...INGRESO_TIPOS.map(t => ({ value: t, label: t }))]} className="flex-1" />
                  <input type="number" value={ing.monto} onChange={(e) => updateIngreso(i, 'monto', Number(e.target.value))} placeholder="0.00"
                    className="w-32 px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-right focus:outline-none focus:bg-white focus:border-sky-400 transition-all" />
                  <input value={ing.comentario || ''} onChange={(e) => updateIngreso(i, 'comentario', e.target.value)} placeholder="Comentario"
                    className="flex-1 px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-sky-400 transition-all" />
                  {formData.ingresos.length > 1 && <button type="button" onClick={() => removeIngreso(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>}
                </div>
              ))}
            </div>
          </div>

          {/* Descuentos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-slate-700">Descuentos</label>
              <button type="button" onClick={addDescuento} className="text-sm font-semibold text-sky-600 hover:text-sky-800 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Agregar
              </button>
            </div>
            <div className="space-y-2">
              {formData.descuentos.map((desc, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <Select value={desc.tipo} onChange={(e) => updateDescuento(i, 'tipo', e.target.value)}
                    options={[{ value: '', label: 'Seleccionar...' }, ...DESCUENTO_TIPOS.map(t => ({ value: t, label: t }))]} className="flex-1" />
                  <input type="number" value={desc.monto} onChange={(e) => updateDescuento(i, 'monto', Number(e.target.value))} placeholder="0.00"
                    className="w-32 px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-right focus:outline-none focus:bg-white focus:border-sky-400 transition-all" />
                  <input value={desc.comentario || ''} onChange={(e) => updateDescuento(i, 'comentario', e.target.value)} placeholder="Comentario"
                    className="flex-1 px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-sky-400 transition-all" />
                  {formData.descuentos.length > 1 && <button type="button" onClick={() => removeDescuento(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>}
                </div>
              ))}
            </div>
          </div>

          {/* Totales */}
          <div className="bg-gradient-to-r from-sky-50 to-emerald-50 border border-sky-100 rounded-2xl p-5">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center p-4 bg-white rounded-xl border border-slate-100">
                <p className="text-slate-500 mb-1 font-medium">Total Haberes</p>
                <p className="text-2xl font-bold text-emerald-600">{formatMonto(totalHaberes)}</p>
              </div>
              <div className="text-center p-4 bg-white rounded-xl border border-slate-100">
                <p className="text-slate-500 mb-1 font-medium">Total Descuentos</p>
                <p className="text-2xl font-bold text-red-500">{formatMonto(totalDescuentos)}</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl text-white shadow-lg shadow-sky-500/25">
                <p className="text-sky-100 mb-1 font-medium">Líquido a Pagar</p>
                <p className="text-3xl font-bold">{formatMonto(totalLiquido)}</p>
              </div>
            </div>
          </div>

          {formError && <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3"><svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><p className="text-sm text-red-600 font-medium">{formError}</p></div>}
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} title="Confirmar Eliminación" size="sm"
        footer={<><Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancelar</Button><Button variant="danger" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Eliminar</Button></>}>
        <p className="text-slate-600">¿Estás seguro de eliminar esta planilla? Esta acción no se puede deshacer.</p>
      </Modal>

      {/* Create Personal Modal */}
      <Modal isOpen={isCreatePersonalOpen} onClose={() => setIsCreatePersonalOpen(false)} title="Nuevo Trabajador" size="md"
        footer={<><Button variant="ghost" onClick={() => setIsCreatePersonalOpen(false)}>Cancelar</Button><Button onClick={handleCreatePersonal} loading={creatingPersonal}>Crear</Button></>}>
        <form onSubmit={handleCreatePersonal} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="DNI" value={newPersonalData.dni} onChange={(e) => setNewPersonalData({ ...newPersonalData, dni: e.target.value })} placeholder="12345678" required />
            <Input label="Puesto" value={newPersonalData.puesto} onChange={(e) => setNewPersonalData({ ...newPersonalData, puesto: e.target.value })} placeholder="Analista" />
          </div>
          <Input label="Nombres" value={newPersonalData.nombres} onChange={(e) => setNewPersonalData({ ...newPersonalData, nombres: e.target.value })} placeholder="Juan" required />
          <Input label="Apellidos" value={newPersonalData.apellidos} onChange={(e) => setNewPersonalData({ ...newPersonalData, apellidos: e.target.value })} placeholder="Pérez García" required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="RD" value={newPersonalData.rd} onChange={(e) => setNewPersonalData({ ...newPersonalData, rd: e.target.value })} placeholder="RD-001" />
            <Input label="UU" value={newPersonalData.uu} onChange={(e) => setNewPersonalData({ ...newPersonalData, uu: e.target.value })} placeholder="UU-001" />
          </div>
          {newPersonalError && <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">{newPersonalError}</div>}
        </form>
      </Modal>

      {/* Export Modal */}
      <Modal isOpen={showExportModal} onClose={() => setShowExportModal(false)} title="Exportar a Excel" size="lg"
        footer={<><Button variant="ghost" onClick={() => setShowExportModal(false)}>Cancelar</Button><Button onClick={handleExport} loading={exporting} disabled={!foundPersonal}>Descargar</Button></>}>
        <div className="space-y-4">
          {/* Buscar por DNI */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Buscar Trabajador por DNI</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchDNI}
                onChange={(e) => setSearchDNI(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchByDNI()}
                placeholder="Ingrese DNI..."
                className="flex-1 px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-sky-400 transition-all"
              />
              <Button onClick={handleSearchByDNI} loading={searchingPersonal}>Buscar</Button>
            </div>
          </div>

          {/* O buscar por nombre */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">O buscar por nombre</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchPersonalList()}
                placeholder="Buscar por nombre o apellidos..."
                className="flex-1 px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-sky-400 transition-all"
              />
              <Button onClick={handleSearchPersonalList} loading={searchingPersonal}>Buscar</Button>
            </div>
          </div>

          {/* Liste des travailleurs */}
          <div className="max-h-48 overflow-auto border border-slate-200 rounded-xl">
            {allPersonal.slice(0, 10).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPersonal(p)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-sky-50 ${foundPersonal?.id === p.id ? 'bg-sky-50' : ''} ${p.id === allPersonal[0]?.id ? '' : 'border-t border-slate-100'}`}
              >
                <div className="w-9 h-9 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 font-semibold text-sm">{p.nombres.charAt(0)}</div>
                <div className="flex-1">
                  <p className="font-medium text-slate-800">{p.apellidos}, {p.nombres}</p>
                  <p className="text-xs text-slate-500">DNI: {p.dni} | {p.puesto}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button onClick={() => { if (personalPage > 1) setPersonalPage(personalPage - 1); handleSearchPersonalList(); }} disabled={personalPage <= 1} className="px-3 py-1 bg-slate-100 rounded-lg disabled:opacity-50">Anterior</button>
              <span className="px-3 py-1">Página {personalPage}</span>
              <button onClick={() => { setPersonalPage(personalPage + 1); handleSearchPersonalList(); }} className="px-3 py-1 bg-slate-100 rounded-lg">Siguiente</button>
            </div>
          )}

          {/* Résultat */}
          {foundPersonal && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
              <p className="font-semibold text-slate-800">{foundPersonal.apellidos}, {foundPersonal.nombres}</p>
              <p className="text-sm text-slate-500">DNI: {foundPersonal.dni} | Puesto: {foundPersonal.puesto}</p>
              <p className="text-sm text-slate-500">RD: {foundPersonal.rd} | UU: {foundPersonal.uu}</p>
            </div>
          )}

          {/* Filtros Mes y Año */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Mes</label>
              <Select
                value={exportFilters.mes}
                onChange={(e) => setExportFilters({ ...exportFilters, mes: Number(e.target.value) })}
                options={MESES.map((m, i) => ({ value: i + 1, label: m }))}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Año</label>
              <Select
                value={exportFilters.anio}
                onChange={(e) => setExportFilters({ ...exportFilters, anio: Number(e.target.value) })}
                options={Array.from({ length: 10 }, (_, i) => ({ value: 2020 + i, label: String(2020 + i) }))}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}