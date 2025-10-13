'use client'

import { Canvas } from '@react-three/fiber'
import { Environment, OrbitControls, useGLTF } from '@react-three/drei'
import { useSearchParams } from 'next/navigation'
import { Suspense, useMemo } from 'react'

function Gltf({ url }: { url: string }) {
  const { scene } = useGLTF(url) // lädt .gltf + .bin + Texturen relativ
  return <primitive object={scene} />
}

export default function ViewerPage() {
  const sp = useSearchParams()
  const scene_uuid = sp.get('scene_uuid') || ''
  const folder = (sp.get('folder') || '').trim()

  // PASSEND ZU DEINER BUCKET-STRUKTUR anpassen:
  // Wenn du speicherst: storage/.../upload/<UUID>/scene.gltf → füge "upload/"
  const modelUrl = useMemo(() => {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET!
    // Variante A: upload/<UUID>/scene.gltf
    return `${base}/storage/v1/object/public/${bucket}/upload/${scene_uuid}/scene.gltf`
    // Variante B (falls du folder/uuid nutzt):
    // return `${base}/storage/v1/object/public/${bucket}/${folder}/${scene_uuid}/scene.gltf`
  }, [scene_uuid, folder])

  if (!scene_uuid) return <div className="p-6">Fehlender Parameter: scene_uuid</div>

  return (
    <div className="h-[80vh] rounded-2xl overflow-hidden border">
      <Canvas camera={{ position: [2, 1.5, 2.5], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <Environment preset="city" />
        <Suspense fallback={null}>
          <Gltf url={modelUrl} />
        </Suspense>
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  )
}
