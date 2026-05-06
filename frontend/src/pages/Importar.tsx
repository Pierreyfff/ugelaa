import { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Calendar, Users, LayoutList } from 'lucide-react'

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
      setError('Solo se permiten archivos Excel (.xlsx, .xls)')
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
        setError(data.error || `Error ${response.status}: ${response.statusText}`)
      }
    } catch (err) {
      setError('Error de conexiÃ³n con el servidor')
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
        <h2 className="text-3xl font-bold text-slate-900">Importar Planilla</h2>
        <p className="text-slate-500">Carga el Excel mensual de planillas en formato de bloques verticales</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* â”€â”€ Panel principal â”€â”€ */}
        <div className="lg:col-span-2 space-y-5">

          {/* PerÃ­odo */}
          <div className="card">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-400 to-purple-500 rounded-xl flex items-center justify-center shadow-md shadow-violet-500/30">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">1. Seleccionar PerÃ­odo</h3>
                <p className="text-xs text-slate-500">Mes y aÃ±o que corresponde la planilla</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mes</label>
                <select
                  value={mes}
                  onChange={e => setMes(Number(e.target.value))}
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-violet-400 transition-colors"
                >
                  {MESES.map(m => (
                    <option key={m.v} value={m.v}>{m.l}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-600 mb-1">AÃ±o</label>
                <select
                  value={anio}
                  onChange={e => setAnio(Number(e.target.value))}
                  className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-violet-400 transition-colors"
                >
                  {ANIOS.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Archivo */}
          <div className="card">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-500 rounded-xl flex items-center justify-center shadow-md shadow-sky-500/30">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">2. Subir Archivo Excel</h3>
                <p className="text-xs text-slate-500">Arrastra o haz clic para seleccionar</p>
              </div>
            </div>

            <div
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200
                ${dragging ? 'border-sky-400 bg-sky-50 scale-[1.01]' : file ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:border-sky-300 hover:bg-sky-50'}`}
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
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <FileSpreadsheet className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-800">{file.name}</p>
                    <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(1)} KB Â· PerÃ­odo: {mesNombre} {anio}</p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="w-14 h-14 bg-gradient-to-br from-sky-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-7 h-7 text-sky-400" />
                  </div>
                  <p className="text-slate-600 font-medium">Haz clic o arrastra aquÃ­ el archivo</p>
                  <p className="text-sm text-slate-400 mt-1">Formatos: .xlsx, .xls</p>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 p-4 bg-rose-50 border-2 border-rose-200 rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 bg-rose-500 rounded-xl flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-rose-700 font-medium text-sm">{error}</span>
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className={`btn-primary flex items-center gap-2 ${(!file || uploading) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {uploading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" />Importando...</>
                ) : (
                  <><Upload className="w-5 h-5" />Importar â€” {mesNombre} {anio}</>
                )}
              </button>
              {(file || result) && !uploading && (
                <button onClick={resetForm} className="btn-secondary">Limpiar</button>
              )}
            </div>
          </div>

          {/* Resultado */}
          {result && (
            <div className="card bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-emerald-900">Â¡ImportaciÃ³n Exitosa!</h3>
                  <p className="text-sm text-emerald-700">{mesNombre} {anio}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Bloques leÃ­dos', value: result.personal ?? result.personal_count ?? 0, color: 'sky' },
                  { label: 'Personal creado', value: result.personal_creados ?? 0, color: 'violet' },
                  { label: 'Planillas creadas', value: result.planillas_creadas ?? 0, color: 'emerald' },
                  { label: 'Total planillas', value: result.planillas ?? result.planillas_count ?? 0, color: 'amber' },
                ].map(({ label, value, color }) => (
                  <div key={label} className={`bg-white rounded-xl p-3 border border-${color}-100 text-center shadow-sm`}>
                    <p className={`text-2xl font-black text-${color}-600`}>{value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
              {result.errores && result.errores.length > 0 && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs font-semibold text-amber-700 mb-1">Advertencias ({result.errores.length})</p>
                  <ul className="text-xs text-amber-600 space-y-1">
                    {result.errores.slice(0, 5).map((e: string, i: number) => <li key={i}>â€¢ {e}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* â”€â”€ Sidebar info â”€â”€ */}
        <div className="space-y-5">
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
                <LayoutList className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Formato del Excel</h3>
                <p className="text-xs text-slate-500">Bloques verticales por empleado</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-xs font-mono border border-slate-200 space-y-0.5 leading-relaxed text-slate-600">
              <p className="text-slate-400">Col A  â”‚ Col B         â”‚ Col C    â”‚ Col D</p>
              <p className="text-slate-300">â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€</p>
              <p><span className="text-violet-600">HABERES</span>â”‚ Apellidos     â”‚ DETALLE  â”‚ FEBRERO</p>
              <p>       â”‚ Nombres       â”‚ BASICA   â”‚ 0.03</p>
              <p>       â”‚               â”‚ PERSONAL â”‚ 0.01</p>
              <p>       â”‚ TRAB.SERV.II  â”‚ DL19990  â”‚ 60.00</p>
              <p>       â”‚ RD 150-93     â”‚ TPH      â”‚ 19.20</p>
              <p>       â”‚ uu-01-0-005   â”‚ ...</p>
              <p className="text-rose-500">DSCTOS â”‚               â”‚ DL20530  â”‚ 3.80</p>
              <p>       â”‚               â”‚ SEG.SOC  â”‚ 3.80</p>
              <p className="text-slate-400">â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€</p>
              <p>TOTAL HABERES                    â”‚ 153.92</p>
              <p>TOTAL DESCUENTOS                 â”‚ 76.27</p>
              <p>TOTAL LIQUIDO                    â”‚ 77.65</p>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-500 rounded-xl flex items-center justify-center shadow-md">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Datos detectados</h3>
            </div>
            <ul className="text-xs text-slate-600 space-y-2">
              {[
                ['Nombre empleado', 'Col B (celdas fusionadas)'],
                ['Puesto / RD / UU', 'Col B (debajo del nombre)'],
                ['DNI', 'Col B â€” "DNI 12345678"'],
                ['Haberes (ingresos)', 'SecciÃ³n HABERES â†’ Col C/D'],
                ['Descuentos', 'SecciÃ³n DSCTOS â†’ Col C/D'],
                ['Mes / AÃ±o', 'Cabecera + tu selecciÃ³n arriba'],
              ].map(([k, v]) => (
                <li key={k} className="flex justify-between gap-2 border-b border-slate-100 pb-1.5">
                  <span className="font-semibold text-slate-700">{k}</span>
                  <span className="text-slate-400 text-right">{v}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-400 bg-amber-50 border border-amber-100 rounded-lg p-2">
              El perÃ­odo que seleccionas <strong>siempre tiene prioridad</strong> sobre lo que detecte el Excel.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
