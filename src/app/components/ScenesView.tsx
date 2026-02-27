'use client'

// ─── ScenesView ───────────────────────────────────────────────────────────────
// Client-Komponente für das Szenen-Grid.
// Aufgaben:
//  - Rendert alle Szenen-Karten
//  - Öffnet das Import-Modal
//  - Führt optimistisches UI-Update beim Import/Löschen durch
//  - Triggert nach Mutation einen Router-Refresh für frische Serverdaten

import { useState, startTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
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
  // Lokaler State für optimistisches UI – wird sofort bei Import/Delete aktualisiert
  const [scenes, setScenes] = useState<Scene[]>(() => initialScenes ?? [])
  const [openImport, setOpenImport] = useState(false)
  const router = useRouter()

  // Synchronisiere lokalen State, wenn Server neue Daten liefert
  useEffect(() => {
    setScenes(initialScenes ?? [])
  }, [initialScenes])

  // ── Import-Handler ─────────────────────────────────────────────────────────
  // Fügt die neue Szene sofort optimistisch ein und ersetzt sie nach Serverantwort
  const handleImport = async (saved: Scene) => {
    const tempId = `temp-${Date.now()}`
    const optimistic: Scene = { ...saved, scene_uuid: tempId }

    // Sofort im UI anzeigen
    setScenes((prev) => [optimistic, ...prev])

    try {
      if (saved?.scene_uuid) {
        // Temporären Eintrag durch den echten ersetzen
        setScenes((prev) => prev.map((s) => (s.scene_uuid === tempId ? saved : s)))
      } else {
        // Kein UUID vom Backend → optimistischen Eintrag zurückrollen
        setScenes((prev) => prev.filter((s) => s.scene_uuid !== tempId))
        console.error('Import ok, aber keine id erhalten')
      }
      startTransition(() => {
        setOpenImport(false)
        router.refresh() // Serverdaten aktualisieren
      })
    } catch (e) {
      // Fehler → Rollback
      setScenes((prev) => prev.filter((s) => s.scene_uuid !== tempId))
      console.error('Import fehlgeschlagen:', e)
    }
  }

  // ── Lösch-Handler ──────────────────────────────────────────────────────────
  // Entfernt die Szene sofort aus dem UI und rollt bei Fehler zurück
  const handleDelete = async (sceneToDelete: Scene) => {
    const backup = scenes
    setScenes((prev) => prev.filter((s) => s.scene_uuid !== sceneToDelete.scene_uuid))
    try {
      if (sceneToDelete.scene_uuid) {
        await deleteScene(sceneToDelete.scene_uuid)
      }
      startTransition(() => router.refresh())
    } catch (e) {
      // Rollback wenn Löschen serverseitig fehlschlägt
      setScenes(backup)
      console.error('Löschen fehlgeschlagen:', e)
    }
  }

  // ── Edit-Handler ───────────────────────────────────────────────────────────
  // Navigiert zum 3D-Viewer mit den Parametern der Szene
  function handleEdit(scene: any) {
    const id = scene?.scene_uuid?.toString?.()
    if (!id) {
      console.error('Fehler: Kann Szene nicht bearbeiten, da scene_uuid fehlt.')
      return
    }

    // Ordner: erst Szene-Feld, sonst Slug aus Titel, sonst Fallback 'upload'
    const folderName =
      (scene?.folder && String(scene.folder).trim()) ||
      slugify(scene?.title ?? '', { lower: true, strict: true, trim: true }) ||
      'upload'

    const ext = scene?.viewerType === 'glb' ? '&ext=glb' : ''

    router.push(
      `/viewer?scene_uuid=${encodeURIComponent(id)}&folder=${encodeURIComponent(folderName)}${ext}&v=${Date.now()}`,
    )
  }

  return (
    <section className="flex-1 p-6 md:p-10">

      {/* ── Seitenkopf ──────────────────────────────────────────────── */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Szenen</h1>
          <p className="mt-0.5 text-sm text-slate-500">{scenes.length} Szene{scenes.length !== 1 ? 'n' : ''} vorhanden</p>
        </div>
        {/* Import-Button in der Kopfzeile (alternativ zum Karten-Button) */}
        <button
          onClick={() => setOpenImport(true)}
          className="hidden sm:flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          Importieren
        </button>
      </div>

      {/* ── Szenen-Grid ─────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">

        {/* Import-Button als Karte (immer sichtbar, auch auf Mobile) */}
        <button
          onClick={() => setOpenImport(true)}
          className="group flex h-56 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700 bg-slate-800/50 text-slate-500 transition hover:border-indigo-500 hover:text-indigo-400"
          aria-label="Neue Szene importieren"
        >
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-slate-700 transition group-hover:bg-indigo-600/20">
            <Plus className="h-5 w-5 transition group-hover:text-indigo-400" />
          </div>
          <div className="text-sm font-medium">Szene importieren</div>
          <div className="mt-1 text-xs text-slate-600">.gltf · .glb · .bin</div>
        </button>

        {/* Szenen-Karten (aus lokalem State für optimistisches UI) */}
        {scenes.map((s, index) => (
          <SceneCard
            key={s.scene_uuid ?? `${s.title}-${index}`}
            scene={s}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* ── Import-Modal ────────────────────────────────────────────── */}
      {openImport && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg">
            <ImportGLTFPage onClose={() => setOpenImport(false)} onImport={handleImport} />
          </div>
        </div>
      )}
    </section>
  )
}
