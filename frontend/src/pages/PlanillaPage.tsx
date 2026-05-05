import React, { useState, useEffect } from 'react';
import { usePlanilla } from '../hooks/usePlanilla';
import { usePersonal } from '../hooks/usePersonal';
import { Button, Input, Select, Modal, Pagination } from '../components';
import { Planilla, Ingreso, Descuento, Personal, CreatePersonalRequest } from '../types';
import { personalApi } from '../api/personal';
import { planillaApi } from '../api/planilla';
import { ImportPlanilla } from '../components/ImportPlanilla';

const INGRESO_TIPOS = [
  { value: 'Sueldo Base', label: 'Sueldo Base' },
  { value: 'Bonificación', label: 'Bonificación' },
  { value: 'Horas Extras', label: 'Horas Extras' },
  { value: 'Asignación Familiar', label: 'Asignación Familiar' },
  { value: 'Movilidad', label: 'Movilidad' },
  { value: 'Viáticos', label: 'Viáticos' },
  { value: 'Otro Ingreso', label: 'Otro Ingreso' },
];

const DESCUENTO_TIPOS = [
  { value: 'AFP', label: 'AFP' },
  { value: 'ESSALUD', label: 'ESSALUD' },
  { value: 'Impuesto', label: 'Impuesto a la Renta' },
  { value: 'Faltas', label: 'Faltas' },
  { value: 'Tardanzas', label: 'Tardanzas' },
  { value: 'Otro Descuento', label: 'Otro Descuento' },
];

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

interface LineItemProps {
  index: number;
  tipo: string;
  monto: number;
  comentario: string | undefined;
  tipos: { value: string; label: string }[];
  onUpdate: (field: keyof Ingreso | keyof Descuento, value: string | number) => void;
  onRemove: () => void;
  canRemove: boolean;
  isIngreso: boolean;
}

function LineItem({ index, tipo, monto, comentario, tipos, onUpdate, onRemove, canRemove, isIngreso }: LineItemProps) {
  return (
    <div className={`flex flex-wrap md:flex-nowrap gap-2 items-center p-3 rounded-xl border ${
      tipo && monto > 0 
        ? (isIngreso ? 'bg-emerald-50/50 border-emerald-200' : 'bg-amber-50/50 border-amber-200')
        : 'bg-slate-50 border-slate-200'
    } transition-all`}>
      <div className="w-full md:w-48">
        <select
          value={tipo}
          onChange={(e) => onUpdate('tipo', e.target.value)}
          className={`w-full px-3 py-2.5 rounded-lg border-2 focus:outline-none transition-all ${
            tipo 
              ? (isIngreso ? 'bg-white border-emerald-300 text-emerald-700' : 'bg-white border-amber-300 text-amber-700')
              : 'bg-white border-slate-200 text-slate-500'
          }`}
        >
          <option value="">{isIngreso ? 'Seleccionar ingreso...' : 'Seleccionar descuento...'}</option>
          {tipos.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>
      <div className="w-full md:w-32">
        <input
          type="number"
          value={monto || ''}
          onChange={(e) => onUpdate('monto', Number(e.target.value))}
          placeholder="0.00"
          className="w-full px-4 py-2.5 bg-white border-2 border-slate-200 rounded-lg text-right font-mono focus:outline-none focus:border-sky-400 transition-all"
        />
      </div>
      <div className="flex-1 min-w-[150px]">
        <input
          value={comentario || ''}
          onChange={(e) => onUpdate('comentario', e.target.value)}
          placeholder="Comentario (opcional)"
          className="w-full px-3 py-2.5 bg-white border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:border-sky-400 transition-all"
        />
      </div>
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
          title="Eliminar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
}

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
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [showImportModal, setShowImportModal] = useState(false);
  const token = localStorage.getItem('token') || '';

  useEffect(() => {
    list({ personal_id: filterPersonalId || undefined, mes: filterMes || undefined, anio: filterAnio, limit: 20 });
  }, [filterMes, filterAnio, filterPersonalId, list]);

  const totalPages = Math.ceil(total / 20);
  const totalHaberesSum = planillas.reduce((sum, p) => sum + p.total_haberes, 0);
  const totalDescuentosSum = planillas.reduce((sum, p) => sum + p.total_descuentos, 0);
  const totalLiquidoSum = planillas.reduce((sum, p) => sum + p.total_liquido, 0);

  const handlePersonalSelect = (p: Personal) => {
    setSelectedPersonal(p);
    setShowPersonalSearch(false);
    searchPersonal('');
    prefill(p.id, formData.mes, formData.anio)
      .then((data) => {
        setFormData(prev => ({
          ...prev,
          ingresos: data.ingresos?.length > 0 ? data.ingresos : [{ tipo: '', monto: 0, comentario: '' }],
          descuentos: data.descuentos?.length > 0 ? data.descuentos : [{ tipo: '', monto: 0, comentario: '' }],
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
    try {
      const full = await planillaApi.get(p.id);
      setEditingPlanilla(full);
      setSelectedPersonal(full.personal || null);
      setFormData({
        mes: full.mes,
        anio: full.anio,
        ingresos: full.ingresos?.length ? full.ingresos : [{ tipo: '', monto: 0, comentario: '' }],
        descuentos: full.descuentos?.length ? full.descuentos : [{ tipo: '', monto: 0, comentario: '' }],
      });
      setFormError('');
      setIsModalOpen(true);
    } catch (err) {
      setFormError('Error al cargar la planilla');
    }
  };

  const toggleRow = (id: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
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
      if (editingPlanilla) {
        await update(editingPlanilla.id, { ingresos, descuentos });
      } else {
        await create({ personal_id: selectedPersonal.id, mes: formData.mes, anio: formData.anio, ingresos, descuentos });
      }
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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative flex flex-col md:flex-row md:justify-between md:items-center gap-6">
          <div className="animate-fadeIn">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold">Planillas</h1>
                <p className="text-slate-400 text-sm">Gestiona las nóminas de los trabajadores</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 animate-fadeIn stagger-1">
            <Button 
              onClick={() => setShowImportModal(true)}
              variant="secondary"
              className="bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm"
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>}
            >
              Importar Excel
            </Button>
            <Button 
              onClick={() => setShowExportModal(true)}
              variant="secondary"
              className="bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm"
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
            >
              Exportar Excel
            </Button>
            <Button 
              onClick={openCreate} 
              className="bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-500/30"
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
            >
              Nueva Planilla
            </Button>
          </div>
        </div>

        <div className="relative mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Total Registros</p>
            <p className="text-2xl font-bold text-white">{total}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Total Haberes</p>
            <p className="text-2xl font-bold text-emerald-400">{formatMonto(totalHaberesSum)}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Total Descuentos</p>
            <p className="text-2xl font-bold text-amber-400">{formatMonto(totalDescuentosSum)}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Total Líquido</p>
            <p className="text-2xl font-bold text-sky-400">{formatMonto(totalLiquidoSum)}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-br from-slate-50 to-sky-50 rounded-2xl shadow-sm border border-slate-200/80 p-6 animate-fadeIn">
        <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
          Filtrar Resultados
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-2 block uppercase tracking-wider">Trabajador</label>
            <Select
              value={filterPersonalId || ''} 
              onChange={(e) => setFilterPersonalId(e.target.value ? Number(e.target.value) : null)}
              options={[{ value: '', label: 'Todos los trabajadores' }, ...allPersonal.map(p => ({ value: p.id, label: `${p.apellidos}, ${p.nombres}` }))]}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-2 block uppercase tracking-wider">Mes</label>
            <Select
              value={filterMes} 
              onChange={(e) => setFilterMes(Number(e.target.value))}
              options={[{ value: 0, label: 'Todos los meses' }, ...MESES.map((m, i) => ({ value: i + 1, label: m }))]}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-2 block uppercase tracking-wider">Año (1993-2100)</label>
            <Select
              value={filterAnio} 
              onChange={(e) => setFilterAnio(Number(e.target.value))}
              options={Array.from({ length: 2100 - 1993 + 1 }, (_, i) => 1993 + i)
                .reverse()
                .slice(0, 10)
                .map(y => ({ value: y, label: String(y) }))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-5 bg-red-50/80 backdrop-blur-sm border border-red-100 rounded-2xl flex items-center gap-4 animate-fadeIn">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <p className="text-sm font-medium text-red-600">{error}</p>
        </div>
      )}

      {/* Loading */}
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
          <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <p className="text-slate-500 font-medium text-lg">No hay planillas registradas</p>
          <p className="text-slate-400 text-sm mt-2">Crea una nueva planilla para comenzar</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm animate-fadeIn">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-50 to-slate-100/50">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-8"></th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Trabajador</th>
                    <th className="px-4 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Periodo</th>
                    <th className="px-4 py-4 text-right text-xs font-bold text-slate-500 uppercase">Haberes</th>
                    <th className="px-4 py-4 text-right text-xs font-bold text-slate-500 uppercase">Descuentos</th>
                    <th className="px-4 py-4 text-right text-xs font-bold text-slate-500 uppercase">Líquido</th>
                    <th className="px-4 py-4 text-right text-xs font-bold text-slate-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {planillas.map((p, i) => (
                    <React.Fragment key={p.id}>
                      <tr className="hover:bg-emerald-50/30 transition-all duration-200" style={{ animationDelay: `${i * 0.03}s` }}>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => toggleRow(p.id)}
                            className="p-1 hover:bg-slate-100 rounded-lg transition-all"
                          >
                            <svg className={`w-4 h-4 text-slate-400 transition-transform ${expandedRows.has(p.id) ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {p.personal?.nombres?.charAt(0) || '?'}
                            </div>
                            <span className="text-sm font-semibold text-slate-800">{p.personal ? `${p.personal.apellidos}, ${p.personal.nombres}` : `ID: ${p.personal_id}`}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">{MESES[p.mes - 1]} {p.anio}</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-sm font-bold text-emerald-600">{formatMonto(p.total_haberes)}</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-sm font-bold text-amber-600">{formatMonto(p.total_descuentos)}</span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className="text-sm font-bold text-sky-600 text-lg">{formatMonto(p.total_liquido)}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => openEdit(p)} className="p-2.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all hover:scale-110" title="Editar">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button onClick={() => setDeleteConfirm(p.id)} className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all hover:scale-110" title="Eliminar">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedRows.has(p.id) && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={7} className="px-4 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Ingresos Detalle */}
                              <div className="bg-emerald-50/50 rounded-xl p-4">
                                <h4 className="text-sm font-bold text-emerald-700 mb-3 flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                  Ingresos ({p.ingresos?.length || 0})
                                </h4>
                                {p.ingresos && p.ingresos.length > 0 ? (
                                  <div className="space-y-2">
                                    {p.ingresos.map((ing, idx) => (
                                      <div key={idx} className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600">{ing.tipo}</span>
                                        <span className="font-mono font-semibold text-emerald-700">{formatMonto(ing.monto)}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-slate-400">Sin ingresos registrados</p>
                                )}
                              </div>
                              {/* Descuentos Detalle */}
                              <div className="bg-amber-50/50 rounded-xl p-4">
                                <h4 className="text-sm font-bold text-amber-700 mb-3 flex items-center gap-2">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                                  Descuentos ({p.descuentos?.length || 0})
                                </h4>
                                {p.descuentos && p.descuentos.length > 0 ? (
                                  <div className="space-y-2">
                                    {p.descuentos.map((desc, idx) => (
                                      <div key={idx} className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600">{desc.tipo}</span>
                                        <span className="font-mono font-semibold text-amber-700">{formatMonto(desc.monto)}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-slate-400">Sin descuentos registrados</p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center pt-4">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => list({ mes: filterMes || undefined, anio: filterAnio, page: p, limit: 20 })} />
            </div>
          )}
        </>
      )}

      {/* Modal Planilla */}
      <Modal
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={editingPlanilla ? `Editar Planilla - ${MESES[formData.mes - 1]} ${formData.anio}` : 'Nueva Planilla'}
        size="xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit}>{editingPlanilla ? 'Guardar Cambios' : 'Crear Planilla'}</Button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Worker Selection */}
          {!editingPlanilla && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Trabajador</label>
              {selectedPersonal ? (
                <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                      {selectedPersonal.nombres.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{selectedPersonal.apellidos}, {selectedPersonal.nombres}</p>
                      <p className="text-sm text-slate-500">DNI: {selectedPersonal.dni}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setSelectedPersonal(null)} className="text-sm font-semibold text-emerald-600 hover:text-emerald-800">Cambiar</button>
                </div>
              ) : (
                <div className="relative">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="text" 
                        placeholder="Buscar trabajador por nombre o DNI..."
                        value={query} 
                        onChange={(e) => { handleQueryChange(e.target.value); setShowPersonalSearch(true); }}
                        onFocus={() => setShowPersonalSearch(true)}
                        className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-400 transition-all"
                      />
                      {showPersonalSearch && allPersonal.length > 0 && (
                        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-auto">
                          {allPersonal.map((p) => (
                            <button key={p.id} type="button" onClick={() => handlePersonalSelect(p)} className="w-full text-left px-4 py-3 hover:bg-emerald-50 flex items-center gap-3 border-b border-slate-50 last:border-b-0">
                              <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-semibold text-sm">{p.nombres.charAt(0)}</div>
                              <div>
                                <p className="font-medium text-slate-800">{p.apellidos}, {p.nombres}</p>
                                <p className="text-xs text-slate-500">{p.dni}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button type="button" onClick={() => setIsCreatePersonalOpen(true)} className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Nuevo
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mes/Año */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Mes</label>
              <div className="grid grid-cols-6 gap-1">
                {MESES.map((m, i) => (
                  <button key={m} type="button" onClick={() => setFormData({ ...formData, mes: i + 1 })}
                    className={`py-2 px-1 rounded-lg text-xs font-medium transition-all ${
                      formData.mes === i + 1 
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}>{m.substring(0, 3)}</button>
                ))}
              </div>
            </div>
            <div className="w-24">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Año</label>
              <Select value={formData.anio} onChange={(e) => setFormData({ ...formData, anio: Number(e.target.value) })}
                options={Array.from({ length: 5 }, (_, i) => ({ value: 2022 + i, label: String(2022 + i) }))} />
            </div>
          </div>

          {/* Ingresos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-slate-700">Ingresos</label>
              <button type="button" onClick={addIngreso} className="text-sm font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Agregar
              </button>
            </div>
            <div className="space-y-2">
              {formData.ingresos.map((ing, i) => (
                <LineItem
                  key={i}
                  index={i}
                  tipo={ing.tipo}
                  monto={ing.monto}
                  comentario={ing.comentario}
                  tipos={INGRESO_TIPOS}
                  onUpdate={(f, v) => updateIngreso(i, f as keyof Ingreso, v)}
                  onRemove={() => removeIngreso(i)}
                  canRemove={formData.ingresos.length > 1}
                  isIngreso={true}
                />
              ))}
            </div>
          </div>

          {/* Descuentos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-slate-700">Descuentos</label>
              <button type="button" onClick={addDescuento} className="text-sm font-semibold text-amber-600 hover:text-amber-800 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Agregar
              </button>
            </div>
            <div className="space-y-2">
              {formData.descuentos.map((desc, i) => (
                <LineItem
                  key={i}
                  index={i}
                  tipo={desc.tipo}
                  monto={desc.monto}
                  comentario={desc.comentario}
                  tipos={DESCUENTO_TIPOS}
                  onUpdate={(f, v) => updateDescuento(i, f as keyof Descuento, v)}
                  onRemove={() => removeDescuento(i)}
                  canRemove={formData.descuentos.length > 1}
                  isIngreso={false}
                />
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gradient-to-r from-emerald-50 to-amber-50 border border-emerald-100 rounded-2xl p-5">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center p-4 bg-white rounded-xl border border-slate-100">
                <p className="text-slate-500 mb-1 font-medium">Total Haberes</p>
                <p className="text-2xl font-bold text-emerald-600">{formatMonto(totalHaberes)}</p>
              </div>
              <div className="text-center p-4 bg-white rounded-xl border border-slate-100">
                <p className="text-slate-500 mb-1 font-medium">Total Descuentos</p>
                <p className="text-2xl font-bold text-amber-600">{formatMonto(totalDescuentos)}</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-500/25">
                <p className="text-emerald-100 mb-1 font-medium">Líquido a Pagar</p>
                <p className="text-3xl font-bold">{formatMonto(totalLiquido)}</p>
              </div>
            </div>
          </div>

          {formError && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-sm text-red-600 font-medium">{formError}</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} title="Confirmar Eliminación" size="sm"
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
            <p className="text-slate-600">¿Estás seguro de eliminar esta planilla?</p>
            <p className="text-sm text-slate-400 mt-1">Esta acción no se puede deshacer.</p>
          </div>
        </div>
      </Modal>

      {/* Create Personal Modal */}
      <Modal isOpen={isCreatePersonalOpen} onClose={() => setIsCreatePersonalOpen(false)} title="Nuevo Trabajador" size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsCreatePersonalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreatePersonal} loading={creatingPersonal}>Crear</Button>
          </>
        }
      >
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
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowExportModal(false)}>Cancelar</Button>
            <Button onClick={handleExport} loading={exporting} disabled={!foundPersonal}>Descargar</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Buscar Trabajador por DNI</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchDNI}
                onChange={(e) => setSearchDNI(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchByDNI()}
                placeholder="Ingrese DNI..."
                className="flex-1 px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-emerald-400 transition-all"
              />
              <Button onClick={handleSearchByDNI} loading={searchingPersonal}>Buscar</Button>
            </div>
          </div>

          {foundPersonal && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
              <p className="font-semibold text-slate-800">{foundPersonal.apellidos}, {foundPersonal.nombres}</p>
              <p className="text-sm text-slate-500">DNI: {foundPersonal.dni} | Puesto: {foundPersonal.puesto}</p>
              <p className="text-sm text-slate-500">RD: {foundPersonal.rd} | UU: {foundPersonal.uu}</p>
            </div>
          )}

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

      {/* Import Modal */}
      <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="Importar Planillas desde Excel" size="lg">
        <ImportPlanilla
          token={token}
          onSuccess={() => {
            list({ mes: filterMes || undefined, anio: filterAnio, limit: 20 });
            setShowImportModal(false);
          }}
        />
      </Modal>
    </div>
  );
}