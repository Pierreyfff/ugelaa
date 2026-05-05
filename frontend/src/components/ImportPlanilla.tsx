import { useState, useRef } from 'react';

interface Ingreso {
  tipo: string;
  monto: number;
}

interface Descuento {
  tipo: string;
  monto: number;
}

interface WorkerData {
  dni: string;
  puesto: string;
  rd: string;
  uu: string;
  ingresos: Ingreso[];
  descuentos: Descuento[];
  total_haberes: number;
  total_descuentos: number;
  total_liquido: number;
}

interface ImportPlanillaResponse {
  created: number;
  updated: number;
  failed: number;
  workers: WorkerData[];
  errors?: string[];
}

interface ImportPlanillaProps {
  token: string;
  onSuccess?: () => void;
}

const MESES = [
  { value: '1', label: 'Enero' },
  { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' },
  { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
];

export function ImportPlanilla({ token, onSuccess }: ImportPlanillaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mes, setMes] = useState('');
  const [anio, setAnio] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [result, setResult] = useState<ImportPlanillaResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const validateInputs = (): boolean => {
    if (!mes) {
      setMessage({ type: 'error', text: 'Por favor selecciona un mes' });
      return false;
    }
    if (!anio) {
      setMessage({ type: 'error', text: 'Por favor selecciona un año' });
      return false;
    }
    const anioNum = parseInt(anio);
    if (anioNum < 1993 || anioNum > 2100) {
      setMessage({ type: 'error', text: 'El año debe estar entre 1993 y 2100' });
      return false;
    }
    return true;
  };

  const handleFile = (file: File) => {
    if (!validateInputs()) {
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls') {
      setMessage({ type: 'error', text: 'Solo se permiten archivos Excel (.xlsx, .xls)' });
      return;
    }

    setIsLoading(true);
    setMessage(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mes', mes);
    formData.append('anio', anio);

    fetch('/api/planilla/import', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
      credentials: 'include',
    })
      .then(async (res) => {
        const data = await res.json();
        setIsLoading(false);
        
        if (!res.ok) {
          throw new Error(data.error || data.details || 'Error al importar');
        }
        
        if (data.errors && data.errors.length > 0) {
          setMessage({
            type: 'error',
            text: `Importación parcial: ${data.created} creados, ${data.updated} actualizados, ${data.failed} fallidos`,
          });
        } else {
          setMessage({
            type: 'success',
            text: `Importación exitosa: ${data.created} creados, ${data.updated} actualizados${data.failed > 0 ? `, ${data.failed} fallidos` : ''}`,
          });
          setResult(data);
          if (onSuccess) onSuccess();
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
      })
      .catch((err) => {
        setIsLoading(false);
        console.error('Error:', err);
        setMessage({ type: 'error', text: err.message || 'Error al importar. Verifica que el archivo sea válido.' });
      });
  };

  const years = Array.from({ length: 2100 - 1993 + 1 }, (_, i) => 1993 + i).reverse();
  const mesLabel = mes ? MESES.find(m => m.value === mes)?.label || '' : '';

  const formatMonto = (m: number) => m.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' });

  return (
    <div className="space-y-6 w-full">
      {/* Header con gradiente */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-6 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold">Importar Planilla</h3>
              <p className="text-white/70 text-sm">Sube tu archivo Excel para importar datos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Selector de Mes y Año */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Mes
          </label>
          <div className="relative">
            <select
              value={mes}
              onChange={(e) => { setMes(e.target.value); setMessage(null); }}
              className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl appearance-none cursor-pointer hover:border-indigo-300 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium text-slate-700"
            >
              <option value="">Seleccionar mes</option>
              {MESES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Año
          </label>
          <div className="relative">
            <select
              value={anio}
              onChange={(e) => { setAnio(e.target.value); setMessage(null); }}
              className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl appearance-none cursor-pointer hover:border-indigo-300 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium text-slate-700"
            >
              <option value="">Seleccionar año</option>
              {years.slice(0, 15).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Período seleccionado */}
      {mes && anio && (
        <div className="flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-indigo-800 font-semibold">Período: {mesLabel} {anio}</span>
        </div>
      )}

      {/* Área de carga */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => mes && anio && fileInputRef.current?.click()}
        className={`
          relative overflow-hidden rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all duration-300
          ${!mes || !anio ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200' : ''}
          ${isDragging && (mes && anio) ? 'border-indigo-400 bg-indigo-50 scale-[1.02] shadow-lg shadow-indigo-200' : (mes && anio) ? 'border-slate-300 hover:border-indigo-300 hover:bg-slate-50' : 'border-slate-300'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
          disabled={!mes || !anio}
        />
        
        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <svg className="w-16 h-16 text-indigo-500 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
              </div>
            </div>
            <div>
              <p className="text-indigo-600 font-semibold text-lg">Procesando archivo...</p>
              <p className="text-slate-400 text-sm mt-1">Esto puede tomar unos segundos</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className={`relative w-20 h-20 rounded-2xl flex items-center justify-center transition-all ${
              isDragging && (mes && anio) ? 'bg-indigo-100 scale-110' : 'bg-slate-100'
            }`}>
              <svg className={`w-10 h-10 transition-colors ${
                isDragging && (mes && anio) ? 'text-indigo-500' : 'text-slate-400'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {isDragging && (mes && anio) && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <p className="text-slate-700 font-semibold text-lg">
                {isDragging && (mes && anio) ? 'Suelta el archivo aquí' : 'Arrastra tu archivo Excel'}
              </p>
              <p className="text-slate-400 text-sm mt-2">
                {mes && anio ? 'o haz clic para seleccionar' : 'Primero selecciona mes y año'}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="px-2 py-1 bg-slate-100 rounded-md">.xlsx</span>
              <span className="px-2 py-1 bg-slate-100 rounded-md">.xls</span>
            </div>
          </div>
        )}
      </div>

      {/* Preview de datos */}
      {result && result.workers.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Vista previa ({result.workers.length} empleados)
            </h3>
            <span className="text-xs text-slate-500 bg-white px-3 py-1 rounded-full border">
              {mesLabel} {anio}
            </span>
          </div>
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left font-bold text-slate-600 text-xs uppercase">DNI</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-600 text-xs uppercase">Puesto</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-600 text-xs uppercase">RD</th>
                  <th className="px-4 py-3 text-right font-bold text-emerald-600 text-xs uppercase">Haberes</th>
                  <th className="px-4 py-3 text-right font-bold text-amber-600 text-xs uppercase">Descuentos</th>
                  <th className="px-4 py-3 text-right font-bold text-indigo-600 text-xs uppercase">Líquido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.workers.slice(0, 20).map((w, i) => (
                  <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-slate-700 font-medium bg-slate-100 px-2 py-1 rounded">{w.dni || '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{w.puesto || '-'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{w.rd || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-emerald-600">{formatMonto(w.total_haberes)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-amber-600">{formatMonto(w.total_descuentos)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-indigo-600 text-base">{formatMonto(w.total_liquido)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {result.workers.length > 20 && (
              <div className="p-3 bg-slate-50 text-center text-sm text-slate-500 border-t">
                ... y {result.workers.length - 20} empleados más
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mensajes */}
      {message && (
        <div className={`p-4 rounded-2xl border-2 flex items-start gap-3 ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : message.type === 'error' 
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
            message.type === 'success' ? 'bg-emerald-100' : message.type === 'error' ? 'bg-red-100' : 'bg-blue-100'
          }`}>
            {message.type === 'success' ? (
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : message.type === 'error' ? (
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div>
            <p className="font-semibold text-sm">{message.text}</p>
          </div>
        </div>
      )}

      {/* Resumen */}
      {result && (
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl border border-emerald-200">
            <div className="text-3xl font-bold text-emerald-600">{result.created}</div>
            <div className="text-xs text-emerald-700 font-medium mt-1">Creados</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl border border-indigo-200">
            <div className="text-3xl font-bold text-indigo-600">{result.updated}</div>
            <div className="text-xs text-indigo-700 font-medium mt-1">Actualizados</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl border border-amber-200">
            <div className="text-3xl font-bold text-amber-600">{result.failed}</div>
            <div className="text-xs text-amber-700 font-medium mt-1">Fallidos</div>
          </div>
        </div>
      )}

      {/* Errores */}
      {result?.errors && result.errors.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
          <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Errores encontrados
          </h4>
          <ul className="space-y-2 text-sm text-red-700">
            {result.errors.slice(0, 5).map((err, i) => (
              <li key={i} className="flex items-start gap-2 bg-white/50 p-2 rounded-lg">
                <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {err}
              </li>
            ))}
            {result.errors.length > 5 && (
              <li className="text-red-600 font-medium bg-white/50 p-2 rounded-lg">... y {result.errors.length - 5} errores más</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}