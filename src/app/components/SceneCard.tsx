'use client'

import { Edit2, Trash2 } from 'lucide-react'

// Prüft ob eine URL auf eine Bilddatei zeigt (und nicht auf eine GLTF/GLB-Datei).
const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif']
function isImageUrl(url?: string): boolean {
  if (!url) return false
  const clean = url.split('?')[0].toLowerCase()
  return IMAGE_EXTS.some((ext) => clean.endsWith(ext))
}

type Scene = {
  id?: string
  scene_uuid?: string
  title: string
  cover?: string
  gltfFileUrl?: string
}

type SceneCardProps = {
  scene: Scene
  onEdit?: (scene: Scene) => void
  onDelete?: (scene: Scene) => void
  showActions?: boolean
  isDuplicate?: boolean
}

// ─── SceneCard ────────────────────────────────────────────────────────────────
export default function SceneCard({
  scene,
  onEdit,
  onDelete,
  showActions = true,
  isDuplicate = false,
}: SceneCardProps) {
  return (
    <article className="group relative rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
      {/* ── Vorschau ─────────────────────────────────────────────────── */}
      {isImageUrl(scene.cover) ? (
        // echte Thumbnail-URL (PNG/JPG/…) → normales Bild
        <img src={scene.cover} alt={scene.title} className="w-full h-40 object-cover" />
      ) : scene.gltfFileUrl ? (
        // kein Bild-Cover, aber GLTF vorhanden → statische 3-D-Vorschau
        // kein auto-rotate, kein camera-controls → verhält sich wie ein Standbild
        <div className="w-full h-40 bg-slate-50">
          {/* @ts-ignore – Typen in ModelViewerComponent.tsx deklariert */}
          <model-viewer
            src={scene.gltfFileUrl}
            alt={scene.title}
            environment-image="neutral"
            shadow-intensity="0.5"
            exposure="1.0"
            loading="lazy"
            style={{
              width: '100%',
              height: '160px',
              backgroundColor: 'transparent',
              pointerEvents: 'none',
            }}
          />
        </div>
      ) : (
        // kein Cover, kein GLTF → Platzhalter
        <div className="w-full h-40 bg-gradient-to-br from-indigo-50 via-gray-50 to-slate-100 flex items-center justify-center">
          <svg
            className="h-10 w-10 text-indigo-200"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
            />
          </svg>
        </div>
      )}

      {/* ── Aktions-Buttons (erscheinen beim Hover) ───────────────── */}
      {showActions && !isDuplicate && (
        <div className="absolute top-2 right-2 flex gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit?.(scene)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-slate-500 shadow-sm backdrop-blur-sm transition hover:bg-indigo-600 hover:text-white"
            aria-label="Szene bearbeiten"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => onDelete?.(scene)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-slate-500 shadow-sm backdrop-blur-sm transition hover:bg-red-500 hover:text-white"
            aria-label="Szene löschen"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      {/* ── Titel ────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-t border-gray-100">
        <h3 className="font-medium text-slate-900 truncate">{scene.title}</h3>
        <p className={`text-xs mt-0.5 ${isDuplicate ? 'text-red-500' : 'text-slate-400'}`}>
          {isDuplicate ? 'Duplikat' : '3D Scene'}
        </p>
      </div>
    </article>
  )
}
