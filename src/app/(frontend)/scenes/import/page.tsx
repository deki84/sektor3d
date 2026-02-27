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

    // Zuerst ZIP lokal validieren (spart unnötigen Upload-Traffic)
    const error = await validateZip(zip)
    if (error) {
      setMsg(error)
      setLoading(false)
      setTimeout(() => setMsg(''), 3000)
      return
    }

    const fd = new FormData()
    fd.append('zip', zip)
    fd.append('name', name)

    // XMLHttpRequest für Upload-Fortschritt
    const xhr = new XMLHttpRequest()
    const url = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/import/gltf`
    xhr.open('POST', url, true)

    // Fortschritts-Event: aktualisiert die Progressbar
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        setProgress(Math.round((ev.loaded / ev.total) * 100))
      }
    }

    // Antwort des Servers verarbeiten
    xhr.onload = () => {
      let ok = xhr.status >= 200 && xhr.status < 300
      let importedScene: Scene | null = null

      if (ok) {
        try {
          importedScene = JSON.parse(xhr.responseText) as Scene
        } catch (err) {
          console.error('Fehler beim Parsen der Backend-Antwort', err)
          ok = false
        }
      }

      setMsg(ok ? 'Erfolgreich gespeichert' : `Fehler: ${xhr.statusText || 'Upload fehlgeschlagen'}`)
      setLoading(false)

      if (ok && importedScene?.scene_uuid) {
        setProgress(100)
        onImport?.(importedScene)
      } else if (ok) {
        console.error('Backend-Import OK, aber keine scene_uuid im Objekt gefunden.')
      }

      setTimeout(() => {
        setMsg('')
        if (ok) onClose?.()
      }, 3000)
    }

    xhr.onerror = () => {
      setMsg('Netzwerkfehler beim Upload')
      setLoading(false)
      setTimeout(() => setMsg(''), 3000)
    }

    xhr.send(fd)
  }

  const isSuccess = msg && !msg.toLowerCase().startsWith('fehler')

  return (
    // Modal-Inhalt: dunkle Karte passend zum Dashboard-Design
    <div className="relative rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-8">

      {/* ── Schließen-Button ────────────────────────────────────────── */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-400 transition hover:bg-slate-700 hover:text-white"
        aria-label="Schließen"
      >
        <X className="h-4 w-4" />
      </button>

      {/* ── Kopfzeile ───────────────────────────────────────────────── */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">GLTF Import</h2>
        <p className="mt-1 text-sm text-slate-400">ZIP-Datei mit GLTF, BIN und Texturen hochladen</p>
      </div>

      <form onSubmit={submit} className="space-y-5">

        {/* ── Szenenname ──────────────────────────────────────────── */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">Szenenname</label>
          <input
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-white placeholder:text-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z. B. Wohnzimmer, Auto, Gebäude"
            required
          />
        </div>

        {/* ── Datei-Upload ────────────────────────────────────────── */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">
            ZIP-Datei
          </label>
          {/* Klick auf das Label öffnet den Dateidialog */}
          <label className="group flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-700 bg-slate-800/50 p-8 cursor-pointer transition hover:border-indigo-500 hover:bg-slate-800">
            <FileArchive className="h-8 w-8 text-slate-500 group-hover:text-indigo-400 transition" />
            <div className="text-center">
              <span className="text-sm font-medium text-slate-300">
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

        {/* ── Upload-Button ───────────────────────────────────────── */}
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow transition hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!zip || !name || loading}
        >
          {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <Upload className="h-5 w-5" />}
          {loading ? 'Importiere…' : 'Import starten'}
        </button>
      </form>

      {/* ── Fortschrittsbalken (nur während Upload sichtbar) ────────── */}
      {loading && (
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
              <span>Wird hochgeladen…</span>
            </div>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-indigo-500 transition-[width] duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Status-Meldung (Erfolg / Fehler) ────────────────────────── */}
      {msg && (
        <div className={`mt-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
          isSuccess
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
            : 'border-red-500/30 bg-red-500/10 text-red-400'
        }`}>
          <span>{isSuccess ? '✓' : '✗'}</span>
          <span>{msg}</span>
        </div>
      )}
    </div>
  )
}
