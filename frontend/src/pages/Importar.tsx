import { useMemo, useRef, useState } from 'react'
import { importarApi } from '../services/api'
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Loader2,
  Users,
  LayoutList,
  FileType,
  ArrowRight,
  HelpCircle,
  Trash2,
  Eye,
  AlertTriangle,
  X,
  Copy,
  Info,
  Check,
} from 'lucide-react'

const MESES = [
  { v: 1, l: 'Enero' }, { v: 2, l: 'Febrero' }, { v: 3, l: 'Marzo' },
  { v: 4, l: 'Abril' }, { v: 5, l: 'Mayo' }, { v: 6, l: 'Junio' },
  { v: 7, l: 'Julio' }, { v: 8, l: 'Agosto' }, { v: 9, l: 'Septiembre' },
  { v: 10, l: 'Octubre' }, { v: 11, l: 'Noviembre' }, { v: 12, l: 'Diciembre' },
]

const currentYear = new Date().getFullYear()
const ANIOS = Array.from({ length: currentYear - 1989 }, (_, i) => 1990 + i).reverse()

type DupRow = {
  id: number
  batch_id: number
  mes: number
  anio: number
  identity_key: string
  repeats: number
  nombres?: string
  dni?: string
  rd?: string
  reason?: string
  created_at?: string
}

type ConflictRow = {
  id: number
  batch_id: number
  mes: number
  anio: number
  identity_key: string
  nombres?: string
  dni?: string
  rd?: string
  reason?: string
  created_at?: string
}

function Modal({
  title,
  subtitle,
  onClose,
  children,
  maxWidthClass = 'max-w-6xl',
}: {
  title: string
  subtitle?: string
  onClose: () => void
  children: React.ReactNode
  maxWidthClass?: string
}) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-[95vw] ${maxWidthClass} max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-white`}>
        <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-slate-950 to-slate-900">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white">{title}</h3>
              {subtitle && <p className="text-xs sm:text-sm text-slate-300 mt-1">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-all"
              aria-label="Cerrar"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-64px)]">
          {children}
        </div>
      </div>
    </div>
  )
}

export default function Importar() {
  const [file, setFile] = useState<File | null>(null)
  const [mes, setMes] = useState<number>(new Date().getMonth() + 1)
  const [anio, setAnio] = useState<number>(currentYear)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Modal logs
  const [showLogModal, setShowLogModal] = useState(false)
  const [logTab, setLogTab] = useState<'duplicados' | 'conflictos'>('duplicados')
  const [logLoading, setLogLoading] = useState(false)
  const [logError, setLogError] = useState<string | null>(null)
  const [duplicados, setDuplicados] = useState<DupRow[]>([])
  const [conflictos, setConflictos] = useState<ConflictRow[]>([])

  // Modal confirmación
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  const mesNombre = MESES.find(m => m.v === mes)?.l ?? ''

  const acceptFile = (f: File) => {
    if (!f.name.match(/\.(xlsx|xls)$/i)) {
      setError('Solo archivos Excel (.xlsx, .xls)')
      return
    }
    setFile(f)
    setError(null)
    setResult(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) acceptFile(selected)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) acceptFile(f)
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError(null)
    setResult(null)

    try {
      const data = await importarApi.excel(file, mes, anio)
      if (data?.error) setError(data.error)
      else setResult(data)
    } catch {
      setError('Error de conexión')
    } finally {
      setUploading(false)
    }
  }

  const resetForm = () => {
    setFile(null)
    setResult(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const openLogs = async (tab: 'duplicados' | 'conflictos') => {
    setShowLogModal(true)
    setLogTab(tab)
    setLogError(null)
    setLogLoading(true)

    try {
      const [dupRes, confRes] = await Promise.all([
        importarApi.duplicados(mes, anio),
        importarApi.conflictos(mes, anio),
      ])
      setDuplicados(dupRes.data ?? [])
      setConflictos(confRes.data ?? [])
    } catch (e: any) {
      setLogError(e.response?.data?.error || 'No se pudo cargar el registro')
    } finally {
      setLogLoading(false)
    }
  }

  const duplicadosAgrupados = useMemo(() => {
    const map = new Map<string, DupRow>()
    for (const d of duplicados) {
      const prev = map.get(d.identity_key)
      if (!prev || (d.repeats ?? 1) > (prev.repeats ?? 1)) map.set(d.identity_key, d)
    }
    return Array.from(map.values()).sort((a, b) => (b.repeats ?? 1) - (a.repeats ?? 1))
  }, [duplicados])

  const copyToClipboard = async (text: string) => {
    try { await navigator.clipboard.writeText(text) } catch { /* noop */ }
  }

  const doLimpiarImportacion = async () => {
    setShowConfirmDelete(false)
    setUploading(true)
    setError(null)
    setResult(null)

    try {
      await importarApi.limpiarMes(mes, anio)
      setResult({
        message: 'Importación limpiada',
        personal_creados: 0,
        planillas_creadas: 0,
        personal: 0,
        planillas: 0,
        errores: [],
      })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al limpiar importación')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Upload className="w-5 h-5 text-rose-600" />
          <span className="text-sm font-semibold text-rose-700">Importación de Datos</span>
        </div>
        <h2 className="page-title">Data Ingestion Suite</h2>
        <p className="text-slate-500 mt-1">Sube tu Excel mensual para cargar planillas en el sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: wizard */}
        <div className="lg:col-span-3 space-y-5">
          {/* Step 1 */}
          <div className="section-card">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-red-700 flex items-center justify-center shadow-lg shadow-rose-600/15">
                <span className="text-white font-extrabold">1</span>
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Selección de periodo</h3>
                <p className="text-xs text-slate-500">Mes y año que se registrarán en las planillas</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Mes</label>
                <select value={mes} onChange={e => setMes(Number(e.target.value))} className="input">
                  {MESES.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Año</label>
                <select value={anio} onChange={e => setAnio(Number(e.target.value))} className="input">
                  {ANIOS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => openLogs('duplicados')}
                className="btn-secondary flex items-center gap-2 py-2 px-3 text-sm"
                type="button"
              >
                <Eye className="w-4 h-4" />
                Ver duplicados
              </button>

              <button
                onClick={() => openLogs('conflictos')}
                className="btn-secondary flex items-center gap-2 py-2 px-3 text-sm"
                type="button"
              >
                <AlertTriangle className="w-4 h-4" />
                Ver conflictos
              </button>

              <button
                onClick={() => setShowConfirmDelete(true)}
                disabled={uploading}
                className="btn-secondary flex items-center gap-2 py-2 px-3 text-sm border border-rose-200 text-rose-700 hover:bg-rose-50"
                type="button"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar importación ({mesNombre} {anio})
              </button>
            </div>
          </div>

          {/* Step 2 */}
          <div className="section-card">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-red-700 flex items-center justify-center shadow-lg shadow-rose-600/15">
                <span className="text-white font-extrabold">2</span>
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Carga de Excel</h3>
                <p className="text-xs text-slate-500">Arrastra el archivo o selecciónalo desde tu equipo</p>
              </div>
            </div>

            <div
              className={`upload-zone relative overflow-hidden ${dragging ? 'upload-zone-active' : file ? 'border-emerald-300 bg-emerald-50/50' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />

              {file ? (
                <div className="flex items-center justify-center gap-5">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
                    <FileSpreadsheet className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">{file.name}</p>
                    <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(1)} KB • {mesNombre} {anio}</p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="w-16 h-16 bg-gradient-to-br from-rose-50 to-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-200">
                    <Upload className="w-8 h-8 text-rose-600" />
                  </div>
                  <p className="text-slate-900 font-semibold mb-1">Arrastra y suelta el archivo aquí</p>
                  <p className="text-sm text-slate-500">o haz clic para seleccionar • .xlsx, .xls</p>

                  <div className="mt-4">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Seleccionar archivo
                    </button>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="alert-error mt-4">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {uploading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Importando...</>
                ) : (
                  <><Upload className="w-4 h-4" />Procesar e importar</>
                )}
              </button>

              {(file || result) && !uploading && (
                <button onClick={resetForm} className="btn-secondary">Limpiar</button>
              )}
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="section-card bg-gradient-to-br from-emerald-50 to-emerald-50 border-emerald-200">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-emerald-900">Operación completada</h3>
                  <p className="text-sm text-emerald-800">Periodo: {mesNombre} {anio}</p>
                  {result.message && <p className="text-xs text-slate-600 mt-1">{result.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Bloques', value: result.personal ?? result.personal_count ?? 0, icon: Users },
                  { label: 'Creados', value: result.personal_creados ?? 0, icon: CheckCircle },
                  { label: 'Planillas', value: result.planillas_creadas ?? 0, icon: FileSpreadsheet },
                  { label: 'Total', value: result.planillas ?? result.planillas_count ?? 0, icon: LayoutList },
                ].map(({ label, value, icon: Icon }, idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-4 border border-emerald-100 text-center">
                    <Icon className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
                    <p className="text-2xl font-extrabold text-emerald-800">{value}</p>
                    <p className="text-xs text-slate-500">{label}</p>
                  </div>
                ))}
              </div>

              {result.errores && result.errores.length > 0 && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                  <p className="text-sm font-extrabold text-amber-800 mb-2">Advertencias ({result.errores.length})</p>
                  <ul className="text-sm text-amber-700 space-y-1">
                    {result.errores.slice(0, 6).map((e: string, i: number) => <li key={i}>• {e}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: instructions */}
        <div className="space-y-5">
          <div className="section-card bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white border border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-rose-300" />
              <h3 className="font-extrabold text-white">Instrucciones</h3>
            </div>
            <ul className="text-sm text-white/80 space-y-2">
              <li className="flex gap-2">
                <span className="mt-0.5 text-rose-300">•</span>
                Verifica que el periodo seleccionado (mes/año) coincida con la planilla.
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 text-rose-300">•</span>
                Asegúrate que el Excel tenga las secciones HABERES y DSCTOS.
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 text-rose-300">•</span>
                Si hay duplicados, revisa “Ver duplicados” antes de continuar.
              </li>
            </ul>
          </div>

          <div className="section-card">
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle className="w-5 h-5 text-rose-600" />
              <h3 className="font-extrabold text-slate-900">Formato requerido</h3>
            </div>

            <div className="space-y-3">
              {[
                { t: 'Archivo', d: 'Excel (.xlsx o .xls)' },
                { t: 'Secciones', d: 'HABERES y DSCTOS' },
                { t: 'Identidad', d: 'Nombres / DNI / RD (si aplica)' },
              ].map((x, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-600 to-red-700 flex items-center justify-center shadow shadow-rose-600/15">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-slate-900">{x.t}</p>
                    <p className="text-xs text-slate-600">{x.d}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <button className="w-full bg-slate-900 hover:bg-slate-950 text-white font-semibold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2">
                <FileType className="w-4 h-4" />
                Descargar plantilla
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[11px] text-slate-400 mt-2">
                (Opcional) Si ya tienes tu formato, puedes omitir esta descarga.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Logs modal */}
      {showLogModal && (
        <Modal
          title="Registro de importación"
          subtitle={`${mesNombre} ${anio}`}
          onClose={() => setShowLogModal(false)}
        >
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              className={`px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 border transition-all ${
                logTab === 'duplicados'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              onClick={() => setLogTab('duplicados')}
            >
              <Eye className="w-4 h-4" />
              Duplicados ({duplicadosAgrupados.length})
            </button>

            <button
              className={`px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 border transition-all ${
                logTab === 'conflictos'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              onClick={() => setLogTab('conflictos')}
            >
              <AlertTriangle className="w-4 h-4" />
              Conflictos ({conflictos.length})
            </button>
          </div>

          {logLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando...
            </div>
          ) : logError ? (
            <div className="alert-error">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{logError}</span>
            </div>
          ) : logTab === 'duplicados' ? (
            duplicadosAgrupados.length === 0 ? (
              <div className="text-center py-10">
                <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
                <p className="font-extrabold text-slate-900">Sin duplicados</p>
                <p className="text-sm text-slate-500">No se detectaron duplicados idénticos para este período.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="text-left px-4 py-3">Empleado</th>
                      <th className="text-left px-4 py-3">DNI</th>
                      <th className="text-left px-4 py-3">RD</th>
                      <th className="text-center px-4 py-3">Repeticiones</th>
                      <th className="text-right px-4 py-3">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {duplicadosAgrupados.map(d => (
                      <tr key={d.identity_key} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-semibold text-slate-900">{d.nombres || d.identity_key}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-700">{d.dni || '-'}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-700">{d.rd || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-100">
                            {d.repeats ?? 1}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
                            onClick={() => copyToClipboard(d.identity_key)}
                            title="Copiar identity_key"
                          >
                            <Copy className="w-4 h-4" />
                            Copiar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            conflictos.length === 0 ? (
              <div className="text-center py-10">
                <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
                <p className="font-extrabold text-slate-900">Sin conflictos</p>
                <p className="text-sm text-slate-500">No se detectaron conflictos para este período.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="text-left px-4 py-3">Empleado</th>
                      <th className="text-left px-4 py-3">DNI</th>
                      <th className="text-left px-4 py-3">RD</th>
                      <th className="text-left px-4 py-3">Motivo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {conflictos.map(cRow => (
                      <tr key={cRow.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-semibold text-slate-900">{cRow.nombres || cRow.identity_key}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-700">{cRow.dni || '-'}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-700">{cRow.rd || '-'}</td>
                        <td className="px-4 py-3 text-slate-600">{cRow.reason || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </Modal>
      )}

      {/* Confirm delete modal */}
      {showConfirmDelete && (
        <Modal
          title="Confirmar eliminación"
          subtitle={`Periodo: ${mesNombre} ${anio}`}
          onClose={() => setShowConfirmDelete(false)}
          maxWidthClass="max-w-xl"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50">
              <p className="font-semibold text-rose-900">¿Eliminar la importación de {mesNombre} {anio}?</p>
              <p className="text-sm text-rose-800 mt-1">
                Esto borrará planillas e importaciones registradas de ese periodo. No se eliminará el personal.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                className="btn-secondary"
                onClick={() => setShowConfirmDelete(false)}
                disabled={uploading}
                type="button"
              >
                Cancelar
              </button>

              <button
                className="btn-danger flex items-center gap-2"
                onClick={doLimpiarImportacion}
                disabled={uploading}
                type="button"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}