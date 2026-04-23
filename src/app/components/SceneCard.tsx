'use client'

import { Edit2, Trash2, XCircle } from 'lucide-react'
import { useState, useEffect } from 'react'

// Checks whether a URL points to an image file (not a GLTF/GLB file).
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

export default function SceneCard({
  scene,
  onEdit,
  onDelete,
  showActions = true,
  isDuplicate = false,
}: SceneCardProps) {
  const [showError, setShowError] = useState(false)

  // Timer: Hide error after 3 seconds
  useEffect(() => {
    if (showError) {
      const timer = setTimeout(() => setShowError(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [showError])

  const handleDeleteClick = () => {
    // Check if this is the demo car
    if (scene.title.toLowerCase() === 'demo_car') {
      setShowError(true)
      return
    }
    // Normal delete
    onDelete?.(scene)
  }

  return (
    <article className="group relative rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
      {/* ── Error Message Overlay ────────────────────────────────────── */}
      {showError && (
        <div className="absolute inset-x-0 top-0 z-50 p-2 animate-in fade-in slide-in-from-top-1 duration-300">
          <div className="bg-red-500/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg flex items-center gap-2 shadow-lg">
            {/* Nur das rote X und der Text */}
            <XCircle size={16} className="flex-shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Demo user cannot delete
            </span>
          </div>
        </div>
      )}

      {/* ── Preview ──────────────────────────────────────────────────── */}
      {isImageUrl(scene.cover) ? (
        <img src={scene.cover} alt={scene.title} className="w-full h-40 object-cover" />
      ) : scene.gltfFileUrl ? (
        <div className="w-full h-40 bg-slate-50">
          {/* @ts-ignore */}
          <model-viewer
            src={scene.gltfFileUrl}
            alt={scene.title}
            environment-image="neutral"
            shadow-intensity="0.5"
            exposure="1.0"
            loading="lazy"
            class="w-full h-40 bg-transparent pointer-events-none"
          />
        </div>
      ) : (
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

      {/* ── Action buttons ────────────────────── */}
      {showActions && !isDuplicate && (
        <div className="absolute top-2 right-2 flex gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit?.(scene)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-slate-500 shadow-sm backdrop-blur-sm transition hover:bg-indigo-600 hover:text-white"
            aria-label="Edit scene"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={handleDeleteClick}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-slate-500 shadow-sm backdrop-blur-sm transition hover:bg-red-500 hover:text-white"
            aria-label="Delete scene"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      {/* ── Title ────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-t border-gray-100">
        <h3 className="font-medium text-slate-900 truncate">{scene.title}</h3>
        <p className={`text-xs mt-0.5 ${isDuplicate ? 'text-red-500' : 'text-slate-400'}`}>
          {isDuplicate ? 'Duplicate' : '3D Vehicle'}
        </p>
      </div>
    </article>
  )
}
