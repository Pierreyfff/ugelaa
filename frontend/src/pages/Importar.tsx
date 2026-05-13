import { useMemo, useRef, useState } from 'react'
import { importarApi } from '../services/api'
import Modal from '../components/Modal'
import { Select } from '../components/Input'
import Button from '../components/Button'
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Loader2,
  Users,
  LayoutList,
  AlertTriangle,
  Trash2,
  Eye,
  Copy,
  Info,
  Check,
  X,
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
  identity_key: string
  repeats: number
  nombres?: string
  dni?: string
  rd?: string
}

type ConflictRow = {
  id: number
  identity_key: string
  nombres?: string
  dni?: string
  rd?: string
  reason?: string
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

  const [showLogModal, setShowLogModal] = useState(false)
  const [logTab, setLogTab] = useState<'duplicados' | 'conflictos'>('duplicados')
  const [logLoading, setLogLoading] = useState(false)
  const [logError, setLogError] = useState<string | null>(null)
  const [duplicados, setDuplicados] = useState<DupRow[]>([])
  const [conflictos, setConflictos] = useState<ConflictRow[]>([])

  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  const mesNombre = MESES.find(m => m.v === mes)?.l ?? ''
  const mesOptions = MESES.map(m => ({ value: m.v, label: m.l }))
  const anioOptions = ANIOS.map(y => ({ value: y, label: y.toString() }))

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
        <h2 className="page-title">Importar</h2>
        <p className="text-gray-500 mt-1">Sube tu Excel mensual para cargar planillas en el sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-5">
          {/* Step 1: Periodo */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                <span className="text-white font-bold text-sm">1</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Selección de periodo</h3>
                <p className="text-xs text-gray-500">Mes y año que se registrarán en las planillas</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-md">
              <Select
                label="Mes"
                value={mes}
                onChange={e => setMes(Number(e.target.value))}
                options={mesOptions}
              />
              <Select
                label="Año"
                value={anio}
                onChange={e => setAnio(Number(e.target.value))}
                options={anioOptions}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" icon={<Eye className="w-4 h-4" />} onClick={() => openLogs('duplicados')}>
                Ver duplicados
              </Button>
              <Button variant="secondary" size="sm" icon={<AlertTriangle className="w-4 h-4" />} onClick={() => openLogs('conflictos')}>
                Ver conflictos
              </Button>
              <Button variant="secondary" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={() => setShowConfirmDelete(true)} disabled={uploading}>
                Eliminar ({mesNombre} {anio})
              </Button>
            </div>
          </div>

          {/* Step 2: Upload */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                <span className="text-white font-bold text-sm">2</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Carga de Excel</h3>
                <p className="text-xs text-gray-500">Arrastra el archivo o selecciónalo desde tu equipo</p>
              </div>
            </div>

            <div
              className={[
                'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
                dragging ? 'border-red-500 bg-red-50' : file ? 'border-emerald-300 bg-emerald-50' : 'border-gray-300 hover:border-red-500 hover:bg-gray-50',
              ].join(' ')}
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
                <div className="flex items-center justify-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center">
                    <FileSpreadsheet className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB • {mesNombre} {anio}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); resetForm() }}
                    className="p-2 rounded-lg hover:bg-gray-200 text-gray-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-3 border border-red-100">
                    <Upload className="w-7 h-7 text-red-600" />
                  </div>
                  <p className="text-gray-900 font-medium mb-1">Arrastra y suelta el archivo aquí</p>
                  <p className="text-sm text-gray-500 mb-4">o haz clic para seleccionar • .xlsx, .xls</p>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    Seleccionar archivo
                  </Button>
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
              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                loading={uploading}
                icon={<Upload className="w-4 h-4" />}
              >
                Procesar e importar
              </Button>

              {(file || result) && !uploading && (
                <Button variant="secondary" onClick={resetForm}>
                  Limpiar
                </Button>
              )}
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="bg-white rounded-2xl border border-emerald-200 p-6">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-emerald-900">Operación completada</h3>
                  <p className="text-sm text-emerald-800">Periodo: {mesNombre} {anio}</p>
                  {result.message && <p className="text-xs text-gray-600 mt-1">{result.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Bloques', value: result.personal ?? result.personal_count ?? 0, icon: Users },
                  { label: 'Creados', value: result.personal_creados ?? 0, icon: CheckCircle },
                  { label: 'Planillas', value: result.planillas_creadas ?? 0, icon: FileSpreadsheet },
                  { label: 'Total', value: result.planillas ?? result.planillas_count ?? 0, icon: LayoutList },
                ].map(({ label, value, icon: Icon }, idx) => (
                  <div key={idx} className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 text-center">
                    <Icon className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
                    <p className="text-2xl font-extrabold text-emerald-800">{value}</p>
                    <p className="text-xs text-gray-500">{label}</p>
                  </div>
                ))}
              </div>

              {result.errores && result.errores.length > 0 && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-sm font-bold text-amber-800 mb-2">Advertencias ({result.errores.length})</p>
                  <ul className="text-sm text-amber-700 space-y-1">
                    {result.errores.slice(0, 6).map((e: string, i: number) => <li key={i}>• {e}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-red-400" />
              <h3 className="font-bold text-white">Instrucciones</h3>
            </div>
            <ul className="text-sm text-white/80 space-y-2">
              <li className="flex gap-2">
                <span className="mt-0.5 text-red-400">•</span>
                Verifica que el periodo coincida con la planilla.
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 text-red-400">•</span>
                Asegúrate que el Excel tenga HABERES y DSCTOS.
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 text-red-400">•</span>
                Si hay duplicados, revisa antes de continuar.
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="font-bold text-gray-900">Formato requerido</h3>
            </div>

            <div className="space-y-3">
              {[
                { t: 'Archivo', d: 'Excel (.xlsx o .xls)' },
                { t: 'Secciones', d: 'HABERES y DSCTOS' },
                { t: 'Identidad', d: 'Nombres / DNI / RD' },
              ].map((x, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{x.t}</p>
                    <p className="text-xs text-gray-500">{x.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Logs Modal */}
      {showLogModal && (
        <Modal
          isOpen={showLogModal}
          onClose={() => setShowLogModal(false)}
          title="Registro de importación"
          subtitle={`${mesNombre} ${anio}`}
          maxWidth="4xl"
        >
          <div className="flex gap-2 mb-4">
            <button
              className={[
                'px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border transition-all',
                logTab === 'duplicados'
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50',
              ].join(' ')}
              onClick={() => setLogTab('duplicados')}
            >
              <Eye className="w-4 h-4" />
              Duplicados ({duplicadosAgrupados.length})
            </button>

            <button
              className={[
                'px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border transition-all',
                logTab === 'conflictos'
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50',
              ].join(' ')}
              onClick={() => setLogTab('conflictos')}
            >
              <AlertTriangle className="w-4 h-4" />
              Conflictos ({conflictos.length})
            </button>
          </div>

          {logLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
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
                <p className="font-bold text-gray-900">Sin duplicados</p>
                <p className="text-sm text-gray-500">No se detectaron duplicados para este período.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Empleado</th>
                      <th>DNI</th>
                      <th>RD</th>
                      <th className="text-center">Repeticiones</th>
                      <th className="text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {duplicadosAgrupados.map(d => (
                      <tr key={d.identity_key} className="table-row">
                        <td className="font-medium text-gray-900">{d.nombres || d.identity_key}</td>
                        <td><span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{d.dni || '-'}</span></td>
                        <td><span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{d.rd || '-'}</span></td>
                        <td className="text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                            {d.repeats ?? 1}
                          </span>
                        </td>
                        <td className="text-right">
                          <Button variant="ghost" size="sm" icon={<Copy className="w-3.5 h-3.5" />} onClick={() => copyToClipboard(d.identity_key)}>
                            Copiar
                          </Button>
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
                <p className="font-bold text-gray-900">Sin conflictos</p>
                <p className="text-sm text-gray-500">No se detectaron conflictos para este período.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Empleado</th>
                      <th>DNI</th>
                      <th>RD</th>
                      <th>Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conflictos.map(cRow => (
                      <tr key={cRow.id} className="table-row">
                        <td className="font-medium text-gray-900">{cRow.nombres || cRow.identity_key}</td>
                        <td><span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{cRow.dni || '-'}</span></td>
                        <td><span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{cRow.rd || '-'}</span></td>
                        <td className="text-gray-600">{cRow.reason || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </Modal>
      )}

      {/* Confirm Delete Modal */}
      {showConfirmDelete && (
        <Modal
          isOpen={showConfirmDelete}
          onClose={() => setShowConfirmDelete(false)}
          title="Confirmar eliminación"
          subtitle={`Periodo: ${mesNombre} ${anio}`}
          maxWidth="sm"
        >
          <div className="space-y-5">
            <div className="p-4 rounded-xl border border-red-200 bg-red-50">
              <p className="font-semibold text-red-900">¿Eliminar la importación de {mesNombre} {anio}?</p>
              <p className="text-sm text-red-800 mt-1">
                Esto borrará planillas e importaciones de ese periodo. No se eliminará el personal.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowConfirmDelete(false)} disabled={uploading}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={doLimpiarImportacion} loading={uploading} icon={<Trash2 className="w-4 h-4" />}>
                Eliminar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}