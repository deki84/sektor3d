'use client'
import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stage, Html, useGLTF } from '@react-three/drei'

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url) // lädt .gltf + .bin + Texturen relativ
  return <primitive object={scene} dispose={null} />
}

export default function ThreeDViewerGLTF({ url }: { url: string }) {
  if (!url) return <div>Keine 3D-Datei gefunden.</div>
  if (!url.endsWith('.gltf')) return <div>Nur .gltf wird unterstützt.</div>

  return (
    <div style={{ height: 360, border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
      <Canvas camera={{ position: [2, 1.5, 2.5], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <Suspense
          fallback={
            <Html center>
              <div style={{ fontSize: 12 }}>Lade 3D…</div>
            </Html>
          }
        >
          <Stage intensity={0.9} environment="city" adjustCamera>
            <Model url={url} />
          </Stage>
        </Suspense>
        <OrbitControls makeDefault enableDamping />
      </Canvas>
    </div>
  )
}
