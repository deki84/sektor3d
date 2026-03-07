import ScenesView from '@/app/components/ScenesView'
import Sidebar from '@/app/components/Sidebar'
import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Scene = {
  scene_uuid?: string
  title: string
  cover?: string
  slug?: string
  gltfFileUrl?: string
}

async function getScenes(userId: string): Promise<Scene[]> {
  const payload = await getPayload({ config: await config })
  const result = await payload.find({
    collection: 'scenes',
    where: { createdBy: { equals: userId } },
    overrideAccess: true,
  })
  return result.docs as unknown as Scene[]
}

export default async function uploadPage3d() {
  // Auth-Check
  const headers = await getHeaders()
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers })
  if (!user) redirect('/login')

  const scenes = await getScenes(String(user!.id))

  return (
    <div className="flex h-screen bg-[#f0f4fa] overflow-hidden">
      <Sidebar activePage="scenes" />
      <div className="flex-1 overflow-y-auto">
        <ScenesView initialScenes={scenes} />
      </div>
    </div>
  )
}
