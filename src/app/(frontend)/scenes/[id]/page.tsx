import ThreeDViewerGLTF from '@/app/components/ui/ThreeDViewerGltf'
import { getSceneById } from '@/app/lib/data/scenes'
import { redirect } from 'next/navigation'

type Scene = {
  id: number
  title: string
  slug: string
  viewerType: 'gltf' | 'shapespark' | 'iframe'
  scene_uuid?: string
  gltfFileUrl?: string
  glbFile?: { url?: string }
  shapesparkURL?: string
  iframeCode?: string
  cover?: string
  published: boolean
  updatedAt: string
  createdAt: string
}

export default async function ScenePage({ params }: { params: Promise<{ scene_uuid: string }> }) {
  const { scene_uuid } = await params // ✅ await params first

  if (scene_uuid === 'import') redirect('/scenes/import') // ✅ prevents /scenes/import from landing here

  const scene = (await getSceneById(scene_uuid)) as Scene | null
  if (!scene) {
    return <main className="container">Scene not found.</main>
  }

  const url = scene.gltfFileUrl || scene.glbFile?.url || ''

  return (
    <main className="container">
      <h1>{scene.title}</h1>
      <ThreeDViewerGLTF url={url} />
    </main>
  )
}
