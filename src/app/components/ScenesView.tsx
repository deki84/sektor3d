'use client'

// ─── ScenesView ───────────────────────────────────────────────────────────────
import { useState, startTransition, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import ImportGLTFPage from '@/app/(frontend)/scenes/import/page'
import SceneCard from '@/app/components/SceneCard'
import LoadModelViewer from '@/app/components/LoadModelViewer'
import { deleteScene } from '@/app/actions/actions'

type Scene = {
  scene_uuid?: string
  title: string
  cover?: string
  folder?: string
  gltfFileUrl?: string
}

interface ScenesViewProps {
  initialScenes: Scene[]
}

export default function ScenesView({ initialScenes }: ScenesViewProps) {
  const [scenes, setScenes] = useState<Scene[]>(() => initialScenes ?? [])
  const [openImport, setOpenImport] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    setScenes((prev) => {
      const prevMap = new Map(prev.map((s) => [s.scene_uuid, s]))
      const serverIds = new Set((initialScenes ?? []).map((s) => s.scene_uuid))
      // Preserve optimistic (temp) scenes not yet reflected in the server response
      const tempScenes = prev.filter(
        (s) => s.scene_uuid?.startsWith('temp-') && !serverIds.has(s.scene_uuid),
      )
      // Merge server scenes, keeping cover/gltfFileUrl from optimistic state if server omits them
      const merged = (initialScenes ?? []).map((s) => {
        const optimistic = prevMap.get(s.scene_uuid)
        return {
          ...s,
          cover: s.cover || optimistic?.cover,
          gltfFileUrl: s.gltfFileUrl || optimistic?.gltfFileUrl,
        }
      })
      return [...tempScenes, ...merged]
    })
  }, [initialScenes])

  useEffect(() => {
    if (searchParams.get('import') === '1') {
      setOpenImport(true)
    }
  }, [searchParams])

  const handleImport = async (saved: Scene) => {
    const tempId = `temp-${Date.now()}`
    const optimistic: Scene = { ...saved, scene_uuid: tempId }
    setScenes((prev) => [optimistic, ...prev])
    try {
      if (saved?.scene_uuid) {
        setScenes((prev) => prev.map((s) => (s.scene_uuid === tempId ? saved : s)))
      } else {
        setScenes((prev) => prev.filter((s) => s.scene_uuid !== tempId))
        console.error('Import ok, but no id received')
      }
      startTransition(() => {
        setOpenImport(false)
        router.refresh()
      })
    } catch (e) {
      setScenes((prev) => prev.filter((s) => s.scene_uuid !== tempId))
      console.error('Import failed:', e)
    }
  }

  const handleDelete = async (sceneToDelete: Scene) => {
    const backup = scenes
    setScenes((prev) => prev.filter((s) => s.scene_uuid !== sceneToDelete.scene_uuid))
    try {
      if (sceneToDelete.scene_uuid) {
        await deleteScene(sceneToDelete.scene_uuid)
      }
      startTransition(() => router.refresh())
    } catch (e) {
      setScenes(backup)
      console.error('Delete failed:', e)
    }
  }

  function handleEdit(scene: Scene) {
    const id = scene?.scene_uuid?.toString?.()
    const url = scene?.gltfFileUrl as string | undefined
    if (!id || !url) {
      console.error('Error: Cannot edit scene, scene_uuid or gltfFileUrl is missing.')
      return
    }
    router.push(
      `/viewer?scene_uuid=${encodeURIComponent(id)}&gltfFileUrl=${encodeURIComponent(url)}&v=${Date.now()}`,
    )
  }

  return (
    <section className="flex-1 p-6 md:p-10 bg-gray-50 min-h-screen pt-20 md:pt-10">
      <LoadModelViewer />
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Showroom</h1>
          <p className="mt-1 text-sm text-slate-500">
            {scenes.length > 0 &&
              `${scenes.length} Vehicle${scenes.length !== 1 ? 's' : ''} in showroom`}
          </p>
        </div>
        <button
          onClick={() => setOpenImport(true)}
          className={`flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 sm:px-4 sm:py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 shrink-0 ${scenes.length === 0 ? 'invisible' : ''}`}
        >
          <Plus className="h-4 w-4" />
          <span>Import</span>
        </button>
      </div>

      {/* ── Scenes Grid ─────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {(() => {
          const titleCount = scenes.reduce<Record<string, number>>((acc, s) => {
            acc[s.title] = (acc[s.title] ?? 0) + 1
            return acc
          }, {})
          return scenes.map((s, index) => (
            <SceneCard
              key={s.scene_uuid ?? `${s.title}-${index}`}
              scene={s}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isDuplicate={titleCount[s.title] > 1}
            />
          ))
        })()}
      </div>

      {/* ── Empty State ─────────────────────────────────────────────── */}
      {scenes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-6 rounded-2xl bg-indigo-50 p-6">
            <svg
              className="h-12 w-12 text-indigo-400"
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
          <h2 className="text-lg font-semibold text-slate-800">No vehicles yet</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-xs">
            Import your first 3D vehicle to get started. Supports GLTF and GLB files.
          </p>

          <button
            onClick={() => setOpenImport(true)}
            className="mt-6 flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Import</span>
          </button>
        </div>
      )}

      {/* ── Import-Modal ────────────────────────────────────────────── */}
      {openImport && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg">
            <ImportGLTFPage onClose={() => setOpenImport(false)} onImport={handleImport} />
          </div>
        </div>
      )}
    </section>
  )
}
