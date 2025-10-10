'use server'

import ScenesView from '@/app/components/ScenesView'

type Scene = {
  scene_uuid?: string
  title: string
  cover?: string
  slug?: string
}

async function getScenes(): Promise<Scene[]> {
  const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const res = await fetch(`${base}/app-api/scenes`, { next: { tags: ['scenes'] } })

  if (!res.ok) {
    throw new Error('Failed to fetch scenes')
  }

  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export default async function uploadPage3d() {
  const scenes = await getScenes()

  return (
    <div className="flex min-h-[calc(100vh-150px)] bg-slate-100">
      {/* Sidebar - kann in der Server-Komponente bleiben */}
      <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white rounded-xl md:block">
        <nav className="p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
            <img src="./logo.png" alt="logo" />
          </div>

          <a
            className="mt-6 flex items-center justify-between rounded-lg bg-indigo-50 px-3 py-2 text-black"
            href="#"
            aria-current="page"
          >
            <span className="font-medium">Scenes</span>
          </a>
        </nav>
      </aside>
      {/* Lade die Client-Komponente und übergebe die geladenen Daten als Prop */}
      <ScenesView initialScenes={scenes} />
    </div>
  )
}
