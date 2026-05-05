import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { CreatePersonalRequest } from '../types';

interface ImportExcelProps {
  onImport: (data: CreatePersonalRequest[], mode: 'create' | 'upsert') => Promise<void>;
}

interface ParsedRow extends CreatePersonalRequest {
  _row: number;
  _status: 'pending' | 'valid' | 'invalid';
  _error?: string;
}

export function ImportExcel({ onImport }: ImportExcelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<ParsedRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [importMode, setImportMode] = useState<'create' | 'upsert'>('upsert');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showHelp, setShowHelp] = useState(false);

  const validateRow = (row: any, index: number): ParsedRow => {
    const dni = String(row.DNI || row.dni || row.Dni || '').trim();
    const nombres = String(row.Nombres || row.nombres || row.Nombres || '').trim();
    const apellidos = String(row.Apellidos || row.apellidos || row.Apellidos || '').trim();
    
    let _error: string | undefined;
    if (!dni) _error = 'DNI requerido';
    else if (dni.length < 5 || dni.length > 20) _error = 'DNI inválido';
    else if (!/^\d+$/.test(dni)) _error = 'DNI debe ser numérico';
    
    if (!nombres) _error = _error || 'Nombres requerido';
    if (!apellidos) _error = _error || 'Apellidos requerido';

    return {
      dni,
      nombres,
      apellidos,
      puesto: String(row.Puesto || row.puesto || row.Puesto || '').trim() || undefined,
      rd: String(row.RD || row.rd || row.RD || '').trim() || undefined,
      uu: String(row.UU || row.uu || row.UU || '').trim() || undefined,
      _row: index + 1,
      _status: _error ? 'invalid' : 'valid',
      _error,
    };
  };

  const processFile = (file: File) => {
    setMessage(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        if (!jsonData || jsonData.length === 0) {
          setMessage({ type: 'error', text: 'El archivo Excel está vacío' });
          return;
        }

        const mappedData: ParsedRow[] = jsonData
          .map((row: any, index: number) => validateRow(row, index))
          .filter(item => item.dni || item.nombres || item.apellidos);

        if (mappedData.length === 0) {
          setMessage({ type: 'error', text: 'No se encontraron datos válidos en el Excel' });
          return;
        }

        const validCount = mappedData.filter(r => r._status === 'valid').length;
        const invalidCount = mappedData.filter(r => r._status === 'invalid').length;

        setPreview(mappedData);
        
        if (invalidCount > 0) {
          setMessage({ type: 'info', text: `${validCount} válidos, ${invalidCount} con errores` });
        } else {
          setMessage(null);
        }
      } catch (err) {
        setMessage({ type: 'error', text: 'Error al procesar el archivo. Asegúrate de que sea un Excel válido.' });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      processFile(file);
    } else {
      setMessage({ type: 'error', text: 'Solo se permiten archivos Excel (.xlsx, .xls)' });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleImport = async () => {
    const validRows = preview.filter(r => r._status === 'valid');
    if (validRows.length === 0) return;
    
    setIsLoading(true);
    setMessage(null);
    try {
      const dataToImport: CreatePersonalRequest[] = validRows.map(({ _row, _status, _error, ...rest }) => rest);
      await onImport(dataToImport, importMode);
      setPreview([]);
      setMessage({ type: 'success', text: `Importación completada correctamente` });
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setPreview([]);
    setMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validCount = preview.filter(r => r._status === 'valid').length;
  const invalidCount = preview.filter(r => r._status === 'invalid').length;
  const failedCount = preview.filter(r => !r.dni || !r.nombres || !r.apellidos).length;

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300
          ${isDragging 
            ? 'border-sky-400 bg-sky-50 scale-[1.02]' 
            : 'border-slate-300 hover:border-sky-300 hover:bg-slate-50'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-3">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${isDragging ? 'bg-sky-100' : 'bg-slate-100'}`}>
            <svg className={`w-8 h-8 ${isDragging ? 'text-sky-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <p className="text-slate-700 font-semibold text-lg">
              {isDragging ? 'Suelta el archivo aquí' : 'Arrastra un archivo Excel'}
            </p>
            <p className="text-slate-400 text-sm mt-1">o haz clic para seleccionar</p>
          </div>
          <p className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-lg">Formatos: .xlsx, .xls</p>
        </div>
      </div>

      {/* Preview Section */}
      {preview.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="bg-gradient-to-r from-sky-500/10 to-sky-600/5 px-6 py-4 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Vista Previa</h3>
                  <p className="text-sm text-slate-500">{preview.length} registros • {validCount} válidos • {invalidCount + failedCount} errores</p>
                </div>
              </div>
              <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-xl transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mode Selection */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-medium text-slate-600">Modo de importación:</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  value="create"
                  checked={importMode === 'create'}
                  onChange={() => setImportMode('create')}
                  className="w-4 h-4 text-sky-500"
                />
                <span className="text-sm text-slate-700">Solo crear nuevos</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="importMode"
                  value="upsert"
                  checked={importMode === 'upsert'}
                  onChange={() => setImportMode('upsert')}
                  className="w-4 h-4 text-sky-500"
                />
                <span className="text-sm text-slate-700">Crear o actualizar existentes</span>
              </label>
              <button 
                type="button"
                onClick={() => setShowHelp(!showHelp)}
                className="ml-auto text-xs text-sky-600 hover:text-sky-800 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.007 2.74-.243.047-.39.297-.39.602V19c0 .552.448 1 1 1h2c.552 0 1-.448 1-1v-1.121c0-.305.147-.555.39-.602 2.29-.165 3.007-1.34 3.007-2.74 0-1.657-1.79-3-4-3z" />
                </svg>
                Ver ayuda
              </button>
            </div>
            
            {showHelp && (
              <div className="mt-3 p-3 bg-sky-50 rounded-xl border border-sky-100 text-sm text-sky-700">
                <p className="font-semibold mb-1">Formato esperado del Excel:</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="bg-white px-2 py-1 rounded text-xs font-mono">DNI</span>
                  <span className="bg-white px-2 py-1 rounded text-xs font-mono">Nombres</span>
                  <span className="bg-white px-2 py-1 rounded text-xs font-mono">Apellidos</span>
                  <span className="bg-white px-2 py-1 rounded text-xs font-mono">Puesto</span>
                  <span className="bg-white px-2 py-1 rounded text-xs font-mono">RD</span>
                  <span className="bg-white px-2 py-1 rounded text-xs font-mono">UU</span>
                </div>
                <p className="mt-2 text-xs text-sky-600">
                  <strong>Solo crear nuevos:</strong> Si el DNI ya existe, se omitirá el registro.<br/>
                  <strong>Crear o actualizar:</strong> Si el DNI existe, actualiza sus datos. Si no existe, crea nuevo registro.
                </p>
              </div>
            )}
          </div>
          
          {/* Table Preview */}
          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-3 text-left font-bold text-slate-500 text-xs uppercase tracking-wider w-10">#</th>
                  <th className="px-3 py-3 text-left font-bold text-slate-500 text-xs uppercase tracking-wider">DNI</th>
                  <th className="px-3 py-3 text-left font-bold text-slate-500 text-xs uppercase tracking-wider">Nombres</th>
                  <th className="px-3 py-3 text-left font-bold text-slate-500 text-xs uppercase tracking-wider">Apellidos</th>
                  <th className="px-3 py-3 text-left font-bold text-slate-500 text-xs uppercase tracking-wider">Puesto</th>
                  <th className="px-3 py-3 text-left font-bold text-slate-500 text-xs uppercase tracking-wider">RD</th>
                  <th className="px-3 py-3 text-left font-bold text-slate-500 text-xs uppercase tracking-wider">UU</th>
                  <th className="px-3 py-3 text-center font-bold text-slate-500 text-xs uppercase tracking-wider w-16">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {preview.slice(0, 15).map((item, i) => (
                  <tr key={i} className={`transition-colors ${item._status === 'invalid' ? 'bg-red-50/50' : 'hover:bg-sky-50/30'}`}>
                    <td className="px-3 py-2.5 text-xs text-slate-400">{item._row}</td>
                    <td className="px-3 py-2.5 font-mono text-slate-700 bg-slate-50 rounded-lg">{item.dni || '-'}</td>
                    <td className="px-3 py-2.5 text-slate-700">{item.nombres || '-'}</td>
                    <td className="px-3 py-2.5 text-slate-700">{item.apellidos || '-'}</td>
                    <td className="px-3 py-2.5 text-slate-500">{item.puesto || '-'}</td>
                    <td className="px-3 py-2.5 text-slate-500">{item.rd || '-'}</td>
                    <td className="px-3 py-2.5 text-slate-500">{item.uu || '-'}</td>
                    <td className="px-3 py-2.5 text-center">
                      {item._status === 'valid' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          OK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium" title={item._error}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Error
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {preview.length > 15 && (
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-500">Mostrando 15 de {preview.length} registros</p>
            </div>
          )}
          
          {(invalidCount > 0 || failedCount > 0) && (
            <div className="px-4 py-3 bg-red-50 border-t border-red-100">
              <p className="text-sm text-red-600 font-medium mb-2">
                Errores encontrados ({invalidCount + failedCount}):
              </p>
              <div className="flex flex-wrap gap-2">
                {preview.filter(r => r._status === 'invalid').slice(0, 5).map((r, i) => (
                  <span key={i} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-mono">
                    Fila {r._row}: {r._error}
                  </span>
                ))}
                {((invalidCount + failedCount) > 5) && (
                  <span className="text-xs text-red-500 py-1">...y {(invalidCount + failedCount) - 5} más</span>
                )}
              </div>
            </div>
          )}
          
          {/* Import Button */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            <button
              onClick={handleImport}
              disabled={isLoading || validCount === 0}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-sky-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-sky-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Importando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Importar {validCount} Registros
                  {importMode === 'upsert' && ' (Upsert)'}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      {message && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 animate-fadeIn ${
          message.type === 'success' ? 'bg-emerald-50 border border-emerald-200' :
          message.type === 'error' ? 'bg-red-50 border border-red-200' :
          'bg-indigo-50 border border-indigo-200'
        }`}>
          {message.type === 'success' ? (
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : message.type === 'error' ? (
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <span className={`text-sm font-medium ${
            message.type === 'success' ? 'text-emerald-700' :
            message.type === 'error' ? 'text-red-700' :
            'text-indigo-700'
          }`}>
            {message.text}
          </span>
        </div>
      )}
    </div>
  );
}