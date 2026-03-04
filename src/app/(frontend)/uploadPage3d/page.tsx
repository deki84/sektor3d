'use server'

import ScenesView from '@/app/components/ScenesView'
import Sidebar from '@/app/components/Sidebar'

type Scene = {
  scene_uuid?: string
  title: string
  cover?: string
  slug?: string
  gltfFileUrl?: string
}

async function getScenes(): Promise<Scene[]> {
  const base = process.env.NEXT_PUBLIC_PAYLOAD_URL || 'http://localhost:3000'
  const res = await fetch(`${base}/api/scenes`, { next: { tags: ['scenes'] } })
  if (!res.ok) throw new Error('Failed to fetch scenes')
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export default async function uploadPage3d() {
  const scenes = await getScenes()

  return (
    <div className="flex h-screen bg-[#f0f4fa] overflow-hidden">
      <Sidebar activePage="scenes" />
      <div className="flex-1 overflow-y-auto">
        <ScenesView initialScenes={scenes} />
      </div>
    </div>
  )
}
