'use client'

import { useState } from 'react'
import JSzip from 'jszip'
import { Loader2, Upload, X, FileArchive } from 'lucide-react'

// Type of the imported scene
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
  // 1) Fetch presign URL (small JSON → no size limit)
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

  // 2) Upload directly to R2 (XHR → progress)
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

// ─── Vehicle Import Modal ─────────────────────────────────────────────────────
// Allows uploading a ZIP file containing a .gltf file.
// Shows upload progress and calls onImport with the saved vehicle.
export default function ImportGLTFPage({ onClose, onImport }: ImportGLTFPageProps) {
  const [zip, setZip] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [msg, setMsg] = useState('')
  const [progress, setProgress] = useState<number>(0)
  const [phase, setPhase] = useState<'upload' | 'processing' | 'done'>('upload')
  const [loading, setLoading] = useState(false)

  // ── ZIP Validation ───────────────────────────────────────────────────────
  // Checks if the file is a ZIP and contains a .gltf file
  async function validateZip(file: File) {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      return 'Please upload ZIP files only'
    }

    const buf = await file.arrayBuffer()
    const zipContent = await JSzip.loadAsync(buf)
    const entries = Object.keys(zipContent.files).map((f) => f.toLowerCase())

    if (!entries.some((f) => f.endsWith('.gltf') || f.endsWith('.glb'))) {
      return 'Error: No .gltf or .glb file found in the ZIP'
    }
    return null
  }

  // ── Upload-Handler ──────────────────────────────────────────────────────
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!zip || !name) return

    setLoading(true)
    setProgress(0)
    setPhase('upload')
    setMsg('')

    const error = await validateZip(zip)
    if (error) {
      setMsg(error)
      setLoading(false)
      setTimeout(() => setMsg(''), 3000)
      return
    }

    try {
      const uploaded = await uploadZipToR2(zip, (pct) => setProgress(Math.round(pct * 0.9)))

      setProgress(90)
      setPhase('processing')

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
        setMsg(data?.message || data?.error || 'Import failed')
        setLoading(false)
        setTimeout(() => setMsg(''), 3000)
        return
      }

      const importedScene = data as Scene

      setProgress(100)
      setPhase('done')
      setMsg('Done!')

      if (importedScene?.scene_uuid) {
        onImport?.(importedScene)
      }

      setTimeout(() => {
        setMsg('')
        onClose?.()
      }, 1500)
    } catch (err: unknown) {
      console.error(err)
      setMsg(err instanceof Error ? err.message : 'Network error during upload')
      setTimeout(() => setMsg(''), 3000)
    } finally {
      setLoading(false)
    }
  }
  const isSuccess = msg && !msg.toLowerCase().startsWith('error')
  return (
    <div className="relative rounded-2xl bg-white border border-gray-200 shadow-2xl p-8">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-slate-500 transition hover:bg-gray-100 hover:text-slate-900"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">Import Vehicle</h2>
        <p className="mt-1 text-sm text-slate-500">
          Upload a ZIP file with the 3D vehicle model (GLTF/GLB, BIN and textures)
        </p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Vehicle Name</label>
          <input
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-slate-900 placeholder:text-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sports Car, Race Car, SUV"
            required
          />
        </div>

        {/* ── File Upload ─────────────────────────────────────────── */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">ZIP file</label>
          <label className="group flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-8 cursor-pointer transition hover:border-indigo-500 hover:bg-gray-100">
            <FileArchive className="h-8 w-8 text-slate-500 group-hover:text-indigo-400 transition" />
            <div className="text-center">
              <span className="text-sm font-medium text-slate-700">
                {zip ? zip.name : 'Choose file'}
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
          {loading ? 'Import…' : 'Start Import'}
        </button>
      </form>

      {loading && (
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              {phase !== 'done' && (
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
              )}
              <span>
                {phase === 'upload' && 'Uploading'}
                {phase === 'processing' && 'Processing'}
                {phase === 'done' && 'Done!'}
              </span>
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
