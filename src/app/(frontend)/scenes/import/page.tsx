'use client'

import { useState } from 'react'
import JSzip from 'jszip'
import { Loader2, Upload, X, FileArchive } from 'lucide-react'

// Typ der importierten Szene
type Scene = {
  scene_uuid?: string
  slug?: string
  title: string
  cover?: string
}

type ImportGLTFPageProps = {
  onClose?: () => void
  onImport?: (scene: Scene) => void
}

async function uploadZipToR2(file: File, onProgress: (pct: number) => void) {
  // 1) Presign holen (kleines JSON -> kein Limit)
  const presignRes = await fetch('/api/r2/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || 'application/zip',
    }),
  })

  const { url, key } = await presignRes.json()
  if (!url || !key) throw new Error('Presign failed')

  // 2) Direkt zu R2 hochladen (XHR -> Fortschritt)
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url, true)

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        onProgress(Math.round((ev.loaded / ev.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`))
    }

    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.setRequestHeader('Content-Type', file.type || 'application/zip')
    xhr.send(file)
  })

  return { key, size: file.size, originalName: file.name }
}

// ─── GLTF-Import Modal ────────────────────────────────────────────────────────
// Ermöglicht das Hochladen einer ZIP-Datei, die eine .gltf-Datei enthält.
// Zeigt Upload-Fortschritt an und ruft onImport mit der gespeicherten Szene auf.
export default function ImportGLTFPage({ onClose, onImport }: ImportGLTFPageProps) {
  const [zip, setZip] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [msg, setMsg] = useState('')
  const [progress, setProgress] = useState<number>(0)
  const [loading, setLoading] = useState(false)

  // ── ZIP-Validierung ──────────────────────────────────────────────────────
  // Prüft ob die Datei eine ZIP ist und eine .gltf-Datei enthält
  async function validateZip(file: File) {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      return 'Bitte nur ZIP-Dateien hochladen'
    }

    const buf = await file.arrayBuffer()
    const zipContent = await JSzip.loadAsync(buf)
    const entries = Object.keys(zipContent.files).map((f) => f.toLowerCase())

    if (!entries.some((f) => f.endsWith('.gltf'))) {
      return 'Fehler: Keine .gltf-Datei in der ZIP gefunden'
    }
    return null
  }

  // ── Upload-Handler ──────────────────────────────────────────────────────
   async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!zip || !name) return

    setLoading(true)
    setProgress(0)
    setMsg('')

    const error = await validateZip(zip)
    if (error) {
      setMsg(error)
      setLoading(false)
      setTimeout(() => setMsg(''), 3000)
      return
    }

    try {
      const uploaded = await uploadZipToR2(zip, (pct) => setProgress(pct))

      const res = await fetch('/api/import/gltf/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneName: name,
          key: uploaded.key,
          originalName: uploaded.originalName,
          size: uploaded.size,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setMsg(data?.message || data?.error || 'Import fehlgeschlagen')
        setLoading(false)
        setTimeout(() => setMsg(''), 3000)
        return
      }

      const importedScene = data as Scene

      setMsg('Erfolgreich gespeichert')
      setProgress(100)

      if (importedScene?.scene_uuid) {
        onImport?.(importedScene)
      }

      setTimeout(() => {
        setMsg('')
        onClose?.()
      }, 1500)
    } catch (err: any) {
      console.error(err)
      setMsg(err?.message || 'Netzwerkfehler beim Upload')
      setTimeout(() => setMsg(''), 3000)
    } finally {
      setLoading(false)
    }
  }
    const isSuccess = msg && !msg.toLowerCase().startsWith('fehler')
  return (
    <div className="relative rounded-2xl bg-white border border-gray-200 shadow-2xl p-8">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-slate-500 transition hover:bg-gray-100 hover:text-slate-900"
        aria-label="Schließen"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">GLTF Import</h2>
        <p className="mt-1 text-sm text-slate-500">
          ZIP-Datei mit GLTF, BIN und Texturen hochladen
        </p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Szenenname</label>
          <input
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-slate-900 placeholder:text-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z. B. Wohnzimmer, Auto, Gebäude"
            required
          />
        </div>

        {/* ── Datei-Upload ────────────────────────────────────────── */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">ZIP-Datei</label>
          <label className="group flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 cursor-pointer transition hover:border-indigo-500 hover:bg-gray-100">
            <FileArchive className="h-8 w-8 text-slate-500 group-hover:text-indigo-400 transition" />
            <div className="text-center">
              <span className="text-sm font-medium text-slate-700">
                {zip ? zip.name : 'Datei auswählen'}
              </span>
              <p className="mt-0.5 text-xs text-slate-500">
                {zip ? `${(zip.size / 1024 / 1024).toFixed(1)} MB` : '.zip · max. 100 MB'}
              </p>
            </div>
            <input
              type="file"
              accept=".zip"
              onChange={(e) => setZip(e.target.files?.[0] || null)}
              className="sr-only"
            />
          </label>
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow transition hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!zip || !name || loading}
        >
          {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <Upload className="h-5 w-5" />}
          {loading ? 'Importiere…' : 'Import starten'}
        </button>
      </form>

      {loading && (
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
              <span>Wird hochgeladen…</span>
            </div>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-indigo-500 transition-[width] duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      

      {msg && (
        <div
          className={`mt-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
            isSuccess
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-red-500/30 bg-red-500/10 text-red-400'
          }`}
        >
          <span>{isSuccess ? '✓' : '✗'}</span>
          <span>{msg}</span>
        </div>
      )}
    </div>
  )
}
