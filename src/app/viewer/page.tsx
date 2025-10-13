'use client'

import { Canvas } from '@react-three/fiber'
import {
  Environment,
  OrbitControls,
  useGLTF,
  Bounds,
  Center,
  ContactShadows,
} from '@react-three/drei'
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

    // optional aus Query: ?ext=glb|gltf (default gltf), ?v=123 (Cache-Buster)
    const extParam = sp.get('ext')?.toLowerCase()
    const ext = extParam === 'glb' ? 'glb' : 'gltf'
    const v = sp.get('v') ? `?v=${encodeURIComponent(sp.get('v')!)}` : ''

    // falls kein folder mitkommt → Fallback 'upload'
    const folderSafe = (folder && folder.replace(/^\/|\/$/g, '')) || 'upload'
    const uuidSafe = encodeURIComponent(scene_uuid)

    return `${base}/storage/v1/object/public/${bucket}/${folderSafe}/${uuidSafe}/scene.${ext}${v}`
  }, [scene_uuid, folder, sp])

  if (!scene_uuid) return <div className="p-6">Fehlender Parameter: scene_uuid</div>

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="w-[min(92vw,1600px)] h-[min(88vh,900px)] rounded-2xl overflow-hidden border shadow-sm">
        <Canvas shadows dpr={[1, 2]} camera={{ position: [3, 2, 6], fov: 45 }}>
          <color attach="background" args={['#f6f7fb']} />
          <ambientLight intensity={0.5} />
          <Suspense fallback={null}>
            <Bounds fit clip observe margin={1.4}>
              {/* ohne disableY -> auch vertikal mittig */}
              <Center>
                <Gltf url={modelUrl} />
              </Center>
            </Bounds>
            <Environment preset="city" />
            <ContactShadows opacity={0.35} blur={2.5} scale={14} far={10} />
          </Suspense>
          <OrbitControls
            makeDefault
            enableDamping
            dampingFactor={0.08}
            minDistance={1.2}
            maxDistance={24}
            /* leichtes „nach unten“-Feeling – bei Bedarf feiner anpassen (-0.3 tiefer, +0.3 höher) */
            target={[0, -0.2, 0]}
          />
        </Canvas>
      </div>
    </div>
  )
}
