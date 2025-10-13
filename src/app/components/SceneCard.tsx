'use client'
import { Edit, Trash } from 'lucide-react'

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

export default function SceneCard({ scene, onEdit, onDelete }: SceneCardProps) {
  return (
    <article className="relative rounded-xl border bg-white shadow-sm overflow-hidden">
      {/* Cover Bild */}
      {scene.cover ? (
        <img src="./security.jpg" alt={scene.title} className="w-full h-32 object-cover" />
      ) : (
        <div className="w-full h-32 bg-slate-100 flex items-center justify-center text-slate-400">
          No Cover
        </div>
      )}

      {/* Titel */}
      <div className="p-3">
        <h3 className="font-medium">{scene.title}</h3>
      </div>

      {/* Menü (Edit/Delete) */}
      <div className="absolute top-2 right-2 flex gap-2">
        <button onClick={() => onEdit?.(scene)} className="p-1.5 rounded-full hover:bg-slate-100">
          <Edit size={16} className="text-slate-600" />
        </button>
        <button onClick={() => onDelete?.(scene)} className="p-1.5 rounded-full hover:bg-slate-100">
          <Trash size={16} className="text-red-600" />
        </button>
      </div>
    </article>
  )
}
