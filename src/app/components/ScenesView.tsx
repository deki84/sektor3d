'use client'

// Diese Client-Komponente rendert die Karten, öffnet das Import-Modal,
// führt Mutationen über Server Actions aus, zeigt neue Karten sofort optimistisch
// und triggert anschließend einen Refresh, damit die Server-Seite frische Daten zieht.

import { useState, startTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ImportGLTFPage from '@/app/(frontend)/scenes/import/page'
import SceneCard from '@/app/components/SceneCard'
import { deleteScene } from '@/app/actions/actions'
import slugify from 'slugify'

type Scene = {
  scene_uuid?: string
  title: string
  cover?: string
  folder?: string
}

interface ScenesViewProps {
  initialScenes: Scene[]
}

export default function ScenesView({ initialScenes }: ScenesViewProps) {
  // Lokaler State, damit optimistisches Update sofort sichtbar ist
  const [scenes, setScenes] = useState<Scene[]>(() => initialScenes ?? [])
  const [openImport, setOpenImport] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setScenes(initialScenes ?? [])
  }, [initialScenes])

  // Import-Handler: optimistisches Hinzufügen + Server Action + Refresh
  const handleImport = async (saved: Scene) => {
    const tempId = `temp-${Date.now()}`
    const optimistic: Scene = { ...saved, scene_uuid: tempId }

    // Sofort anzeigen
    setScenes((prev) => [optimistic, ...prev])

    try {
      // Serverseitig speichern

      // Temporären Eintrag durch echten ersetzen (id muss vorhanden sein)
      if (saved?.scene_uuid) {
        setScenes((prev) => prev.map((s) => (s.scene_uuid === tempId ? saved : s)))
      } else {
        // Falls keine id zurückkommt: wieder entfernen
        setScenes((prev) => prev.filter((s) => s.scene_uuid !== tempId))
        console.error('Import ok, aber keine id erhalten')
      }
      startTransition(() => {
        setOpenImport(false)
        router.refresh()
      })
    } catch (e) {
      // Bei Fehler: zurückrollen
      setScenes((prev) => prev.filter((s) => s.scene_uuid !== tempId))
      console.error('Import fehlgeschlagen:', e)
    }
  }

  // Lösch-Handler: optimistisch entfernen + Server Action + ggf. Rollback
  const handleDelete = async (sceneToDelete: Scene) => {
    const backup = scenes
    setScenes((prev) => prev.filter((s) => s.scene_uuid !== sceneToDelete.scene_uuid))
    try {
      if (sceneToDelete.scene_uuid) {
        await deleteScene(sceneToDelete.scene_uuid)
      }
      startTransition(() => router.refresh())
    } catch (e) {
      // Rollback wenn Löschen fehlschlägt
      setScenes(backup)
      console.error('Löschen fehlgeschlagen:', e)
    }
  }

  function handleEdit(scene: any) {
    if (scene.scene_uuid) {
      const folder =
        (scene.folder && scene.folder.trim()) ||
        slugify(scene.title ?? '', { lower: true, strict: true, trim: true })

      if (!folder) {
        console.warn('Kein Ordner ermittelbar.')
        return
      }
      router.push(`/viewer?scene_uuid=${encodeURIComponent(scene.scene_uuid)}`)

      // Optionale Fehlerbehandlung, falls die ID fehlt (z.B. bei temp. optimistischer Szene)
      console.error('Fehler: Kann Szene nicht bearbeiten, da scene_uuid fehlt.')
      // Hier könntest du eine Benachrichtigung anzeigen
    }
  }

  return (
    <section className="flex-1 p-6 md:p-10">
      <h1 className="mb-6 text-3xl font-semibold">Szenen</h1>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {/* Import-Button öffnet das Modal */}
        <button
          onClick={() => setOpenImport(true)}
          className="group flex h-56 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white text-slate-600 shadow-sm transition hover:border-indigo-400 hover:text-indigo-600"
          aria-label="Neue Szene importieren"
        >
          <div className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-indigo-100 transition group-hover:bg-indigo-200">
            <span className="text-2xl">📥</span>
          </div>
          <div className="text-sm font-medium">Szene importieren</div>
          <div className="mt-1 text-xs text-slate-400">.gltf .bin</div>
        </button>

        {/* Karten aus dem lokalen State (wichtig für optimistisches UI) */}
        {scenes.map((s, index) => (
          <SceneCard
            key={s.scene_uuid ?? `${s.title}-${index}`}
            scene={s}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Import-Modal */}
      {openImport && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-0">
          <div className="w-full max-w-none sm:max-w-3xl">
            {/* onImport MUSS in ImportGLTFPage beim Erfolg aufgerufen werden */}
            <ImportGLTFPage onClose={() => setOpenImport(false)} onImport={handleImport} />
          </div>
        </div>
      )}
    </section>
  )
}
