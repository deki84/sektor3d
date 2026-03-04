// Server component — reads searchParams on the server, passes URL to the
// client-side ModelViewerComponent. No 'use client' / useSearchParams needed.

import ModelViewerComponent from '@/app/components/ModelViewerComponent'

type SearchParams = Promise<{ scene_uuid?: string; gltfFileUrl?: string }>

export default async function ViewerPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const gltfFileUrl = decodeURIComponent(params.gltfFileUrl ?? '')
  const sceneUuid = params.scene_uuid ?? ''

  if (!sceneUuid || !gltfFileUrl) {
    return (
      <div className="flex items-center justify-center w-screen h-screen text-neutral-500 text-sm">
        Missing parameter: <code className="ml-1 font-mono">scene_uuid</code>&nbsp;/&nbsp;
        <code className="font-mono">gltfFileUrl</code>
      </div>
    )
  }

  return <ModelViewerComponent modelUrl={gltfFileUrl} />
}
