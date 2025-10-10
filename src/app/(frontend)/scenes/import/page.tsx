'use client'
import { useState } from 'react'
import JSzip from 'jszip'
import { Loader2, Upload } from 'lucide-react'

// Definieren des Typs für die Scene, die zurückgegeben wird
type Scene = {
  scene_uuid?: string
  slug?: string
  title: string
  cover?: string
}

type ImportGLTFPageProps = {
  onClose?: () => void
  onImport?: (scene: Scene) => void // Neue Prop hinzugefügt
}

export default function ImportGLTFPage({ onClose, onImport }: ImportGLTFPageProps) {
  const [zip, setZip] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [msg, setMsg] = useState('')
  const [progress, setProgress] = useState<number>(0)

  const [loading, setLoading] = useState(false)

  async function validateZip(file: File) {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      return '❌ Bitte nur zip Dateien hochladen'
    }

    const buf = await file.arrayBuffer()
    const zipContent = await JSzip.loadAsync(buf)
    const entries = Object.keys(zipContent.files).map((f) => f.toLowerCase())

    if (!entries.some((f) => f.endsWith('.gltf'))) {
      return '❌ Fehler: Ungültige oder unvollständige Datei'
    }
    return null
  }

  const handleTestImport = () => {
    if (onImport) {
      onImport({
        title: name || 'Test-Szene',
        cover: 'https://placehold.co/400x200?text=Test-Import',
      })
      onClose?.()
    }
  }

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

    const fd = new FormData()
    fd.append('zip', zip)
    fd.append('name', name)

    const xhr = new XMLHttpRequest()
    const url = `${process.env.NEXT_PUBLIC_SERVER_URL}/api/import/gltf`
    xhr.open('POST', url, true)

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) {
        const pct = Math.round((ev.loaded / ev.total) * 100)
        setProgress(pct)
      }
    }

    xhr.onload = () => {
      let ok = xhr.status >= 200 && xhr.status < 300
      let importedScene: Scene | null = null

      if (ok) {
        try {
          // Das Backend gibt das fertige Szene-Objekt zurück
          importedScene = JSON.parse(xhr.responseText) as Scene
        } catch (err) {
          console.error('Fehler bei Parsen der Backend-Antwort', err)
          ok = false
        }
      }
      setMsg(
        ok
          ? '✅ Erfolgreich gespeichert'
          : `❌ Fehler: ${xhr.statusText || 'Upload fehlgeschlagen'}`,
      )
      setLoading(false)

      if (ok && importedScene?.scene_uuid) {
        // ✨ Prüfe, ob die UUID vorhanden ist
        setProgress(100) // ✨ KORREKTUR: Übergib das vollständige, geparste Objekt an onImport

        if (onImport) {
          onImport(importedScene)
        }
      } else if (ok) {
        // Fall, in dem Upload OK war, aber das Backend keine UUID zurückgab (Fehler in der Backend-Logik)
        console.error('Backend-Import OK, aber keine scene_uuid im Objekt gefunden.')
      }

      setTimeout(() => {
        setMsg('') // ✨ Schließe das Fenster nach erfolgreichem Import
        if (ok && onClose) {
          onClose()
        }
      }, 3000)
    }

    xhr.onerror = () => {
      setMsg('❌ Netzwerkfehler beim Upload')
      setLoading(false)
      setTimeout(() => setMsg(''), 3000)
    }

    xhr.send(fd)
  }

  return (
    <main className="relative max-w-xl mx-auto mt-10 p-8 bg-white shadow-lg rounded-2xl border border-gray-200">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">GLTF Import</h1>

      {/* X schließt nur */}
      <button
        type="button"
        onClick={() => {
          onClose?.()
        }}
        className="absolute right-4 top-4 z-[999] grid h-8 w-8 place-items-center rounded-full border border-gray-300 bg-white/90 text-gray-600 hover:bg-white hover:text-gray-900 shadow"
        aria-label="Close"
      >
        ✕
      </button>

      <form onSubmit={submit} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Szenenname</label>
          <input
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z. B. Wohnzimmer, Auto, Gebäude"
          />
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ZIP-Datei (GLTF + Texturen + Bin)
          </label>
          <input
            type="file"
            accept=".zip"
            onChange={(e) => setZip(e.target.files?.[0] || null)}
            className="w-full border border-dashed border-gray-400 rounded-lg p-4 text-gray-600 file:hidden cursor-pointer hover:border-indigo-500"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
          disabled={!zip || !name || loading}
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
          {loading ? 'Importiere...' : 'Import starten'}
        </button>
      </form>
      {loading && (
        <div className="mt-3">
          <div className="mb-2 flex items-center gap-2 text-xs text-slate-600">
            <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-indigo-500" />
            <span>Uploading: {progress}%</span>
          </div>
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-indigo-600 transition-[width] duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Nachricht */}
      {msg && (
        <p
          className={`mt-6 text-sm font-medium ${
            msg.startsWith('✅') ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {msg}
        </p>
      )}
    </main>
  )
}
