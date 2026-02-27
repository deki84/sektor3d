'use server'

import ScenesView from '@/app/components/ScenesView'
import { Layers } from 'lucide-react'

type Scene = {
  scene_uuid?: string
  title: string
  cover?: string
  slug?: string
}

// Szenen vom internen API-Endpunkt laden (serverseitig, mit Cache-Tag)
async function getScenes(): Promise<Scene[]> {
  const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const res = await fetch(`${base}/api/scenes`, { next: { tags: ['scenes'] } })

  if (!res.ok) {
    throw new Error('Failed to fetch scenes')
  }

  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export default async function uploadPage3d() {
  const scenes = await getScenes()

  return (
    // Haupt-Layout: Sidebar + Hauptbereich nebeneinander
    <div className="flex h-screen bg-slate-950 overflow-hidden">

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside className="hidden w-64 shrink-0 flex-col bg-slate-900 border-r border-slate-800 md:flex">

        {/* Logo-Bereich */}
        <div className="flex h-16 items-center px-5 border-b border-slate-800">
          <img src="/logo.png" alt="Sektor3D Logo" className="h-8 w-auto" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {/* Aktiver Menüpunkt: Scenes */}
          <a
            href="#"
            aria-current="page"
            className="flex items-center gap-3 rounded-xl bg-indigo-600/20 px-3 py-2.5 text-indigo-300 font-medium transition hover:bg-indigo-600/30"
          >
            <Layers className="h-4 w-4 shrink-0" />
            <span>Scenes</span>
          </a>
        </nav>

        {/* Footer der Sidebar */}
        <div className="p-4 border-t border-slate-800">
          <p className="text-xs text-slate-600">Sektor3D v1.0</p>
        </div>
      </aside>

      {/* ── Hauptbereich: Client-Komponente mit den Szenen-Karten ─────── */}
      <div className="flex-1 overflow-y-auto bg-slate-950">
        <ScenesView initialScenes={scenes} />
      </div>
    </div>
  )
}
