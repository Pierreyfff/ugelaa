import { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Calendar, Users, LayoutList, FileType, ArrowRight, HelpCircle } from 'lucide-react'

const MESES = [
  { v: 1, l: 'Enero' }, { v: 2, l: 'Febrero' }, { v: 3, l: 'Marzo' },
  { v: 4, l: 'Abril' }, { v: 5, l: 'Mayo' }, { v: 6, l: 'Junio' },
  { v: 7, l: 'Julio' }, { v: 8, l: 'Agosto' }, { v: 9, l: 'Septiembre' },
  { v: 10, l: 'Octubre' }, { v: 11, l: 'Noviembre' }, { v: 12, l: 'Diciembre' },
]

const currentYear = new Date().getFullYear()
const ANIOS = Array.from({ length: currentYear - 1989 }, (_, i) => 1990 + i).reverse()

export default function Importar() {
  const [file, setFile] = useState<File | null>(null)
  const [mes, setMes] = useState<number>(new Date().getMonth() + 1)
  const [anio, setAnio] = useState<number>(currentYear)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) acceptFile(selected)
  }

  const acceptFile = (f: File) => {
    if (!f.name.match(/\.(xlsx|xls)$/i)) {
      setError('Solo archivos Excel (.xlsx, .xls)')
      return
    }
    setFile(f)
    setError(null)
    setResult(null)
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
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mes', String(mes))
      formData.append('anio', String(anio))

      const response = await fetch('/python/process-excel', { method: 'POST', body: formData })

      const data = await response.json()
      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || `Error ${response.status}`)
      }
    } catch (err) {
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

  const mesNombre = MESES.find(m => m.v === mes)?.l ?? ''

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Upload className="w-5 h-5 text-cyan-500" />
          <span className="text-sm font-medium text-cyan-600">Importación de Datos</span>
        </div>
        <h2 className="page-title">Importar Planilla</h2>
        <p className="text-slate-500 mt-1">Carga archivos Excel para importar nóminas masivamente</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="section-card">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">1. Seleccionar Período</h3>
                <p className="text-xs text-slate-500">Mes y año de la planilla</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-600 mb-2">Mes</label>
                <select
                  value={mes}
                  onChange={e => setMes(Number(e.target.value))}
                  className="input"
                >
                  {MESES.map(m => (
                    <option key={m.v} value={m.v}>{m.l}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-600 mb-2">Año</label>
                <select
                  value={anio}
                  onChange={e => setAnio(Number(e.target.value))}
                  className="input"
                >
                  {ANIOS.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="section-card">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">2. Subir Archivo</h3>
                <p className="text-xs text-slate-500">Arrastra el archivo o haz clic para seleccionar</p>
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
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <FileSpreadsheet className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-800">{file.name}</p>
                    <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(1)} KB • {mesNombre} {anio}</p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-cyan-500" />
                  </div>
                  <p className="text-slate-700 font-medium mb-1">Arrastra el archivo aquí</p>
                  <p className="text-sm text-slate-400">o haz clic para seleccionar • .xlsx, .xls</p>
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
                  <><Upload className="w-4 h-4" />Importar - {mesNombre} {anio}</>
                )}
              </button>
              {(file || result) && !uploading && (
                <button onClick={resetForm} className="btn-secondary">Limpiar</button>
              )}
            </div>
          </div>

          {result && (
            <div className="section-card bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-emerald-900">¡Importación Exitosa!</h3>
                  <p className="text-sm text-emerald-700">Período: {mesNombre} {anio}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Bloques', value: result.personal ?? result.personal_count ?? 0, icon: Users },
                  { label: 'Creados', value: result.personal_creados ?? 0, icon: CheckCircle },
                  { label: 'Planillas', value: result.planillas_creadas ?? 0, icon: FileSpreadsheet },
                  { label: 'Total', value: result.planillas ?? result.planillas_count ?? 0, icon: LayoutList },
                ].map(({ label, value, icon: Icon }, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-4 border border-emerald-100 text-center">
                    <Icon className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-emerald-700">{value}</p>
                    <p className="text-xs text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
              {result.errores && result.errores.length > 0 && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-sm font-semibold text-amber-700 mb-2">Advertencias ({result.errores.length})</p>
                  <ul className="text-sm text-amber-600 space-y-1">
                    {result.errores.slice(0, 5).map((e: string, i: number) => <li key={i}>• {e}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="section-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
                <LayoutList className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Formato Excel</h3>
            </div>
            <div className="bg-slate-900 rounded-xl p-4 text-xs font-mono text-slate-300 space-y-1">
              <div className="flex gap-2 text-slate-500 border-b border-slate-700 pb-2 mb-2">
                <span className="w-8">Col A</span>
                <span className="w-16">Col B</span>
                <span className="w-16">Col C</span>
                <span className="flex-1">Col D</span>
              </div>
              <p className="text-violet-400">HABERES</p>
              <p><span className="text-slate-500">|</span> Apellidos <span className="text-slate-500">|</span> DETALLE <span className="text-slate-500">|</span> MES</p>
              <p><span className="text-slate-500">|</span> Nombres <span className="text-slate-500">|</span> BASICA <span className="text-slate-500">|</span> 0.03</p>
              <p><span className="text-slate-500">|</span> <span className="text-slate-600">|</span> PERSONAL <span className="text-slate-500">|</span> 0.01</p>
              <p className="text-red-400 mt-2">DSCTOS</p>
              <p><span className="text-slate-500">|</span> <span className="text-slate-600">|</span> DL20530 <span className="text-slate-500">|</span> 3.80</p>
              <div className="flex gap-2 mt-2 pt-2 border-t border-slate-700">
                <span className="text-emerald-400">TOTAL</span>
                <span className="text-slate-500">|</span>
                <span className="text-emerald-400">153.92</span>
              </div>
            </div>
          </div>

          <div className="section-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Estructura de Datos</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Nombre', desc: 'Columna B - Nombres' },
                { label: 'Puesto', desc: 'Columna B - Puesto' },
                { label: 'DNI', desc: 'Columna B - DNI' },
                { label: 'Ingresos', desc: 'Sección HABERES' },
                { label: 'Descuentos', desc: 'Sección DSCTOS' },
              ].map(({ label, desc }, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">{label}</p>
                    <p className="text-xs text-slate-400">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="section-card bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
            <h3 className="font-bold text-white mb-2">¿Necesitas ayuda?</h3>
            <p className="text-sm text-white/80 mb-4">Descarga nuestra plantilla de ejemplo para facilitar la importación</p>
            <button className="w-full bg-white/20 hover:bg-white/30 text-white font-medium py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2">
              <FileType className="w-4 h-4" />
              Descargar Plantilla
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}