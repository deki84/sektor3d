'use client'

import { Edit2, Trash2 } from 'lucide-react'

type Scene = {
  id?: string
  title: string
  cover?: string
}

type SceneCardProps = {
  scene: Scene
  onEdit?: (scene: Scene) => void
  onDelete?: (scene: Scene) => void
}

// ─── SceneCard ────────────────────────────────────────────────────────────────
// Zeigt eine einzelne 3D-Szene als Karte an.
// Auf Hover erscheinen die Aktions-Buttons (Bearbeiten / Löschen).
export default function SceneCard({ scene, onEdit, onDelete }: SceneCardProps) {
  return (
    <article className="group relative rounded-2xl bg-slate-800 border border-slate-700 shadow-lg overflow-hidden transition hover:-translate-y-0.5 hover:shadow-indigo-900/30 hover:shadow-xl">

      {/* ── Cover-Bild oder Platzhalter ──────────────────────────── */}
      {scene.cover ? (
        <img
          src={scene.cover}
          alt={scene.title}
          className="w-full h-40 object-cover"
        />
      ) : (
        // Kein Cover vorhanden → stilisierter Platzhalter
        <div className="w-full h-40 bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
          <svg className="h-10 w-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
          </svg>
        </div>
      )}

      {/* ── Aktions-Buttons (erscheinen beim Hover) ───────────────── */}
      <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Bearbeiten */}
        <button
          onClick={() => onEdit?.(scene)}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/80 text-slate-300 backdrop-blur-sm transition hover:bg-indigo-600 hover:text-white"
          aria-label="Szene bearbeiten"
        >
          <Edit2 size={14} />
        </button>
        {/* Löschen */}
        <button
          onClick={() => onDelete?.(scene)}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/80 text-slate-300 backdrop-blur-sm transition hover:bg-red-600 hover:text-white"
          aria-label="Szene löschen"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* ── Titel ────────────────────────────────────────────────── */}
      <div className="px-4 py-3">
        <h3 className="font-medium text-slate-100 truncate">{scene.title}</h3>
        <p className="text-xs text-slate-500 mt-0.5">3D Szene</p>
      </div>
    </article>
  )
}
