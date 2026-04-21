'use client'

import { useEffect, Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Html, useGLTF, Bounds } from '@react-three/drei'
import * as THREE from 'three'

interface Props {
  modelUrl: string
}

const COLORS = [
  { label: 'Black', hex: '#1a1a1a' },
  { label: 'White', hex: '#f5f5f5' },
  { label: 'Silver', hex: '#c0c0c0' },
  { label: 'Red', hex: '#FF0000' },
  { label: 'Blue', hex: '#1a3a6b' },
  { label: 'Gold', hex: '#c8a415' },
]

const SKIP_KEYWORDS = [
  'window', 'glass', 'glas', 'interior', 'wheel',
  'tire', 'light', 'badge', 'grille', 'engine', 'seat', 'carbon',
]

function Model({ url, activeColor }: { url: string; activeColor: string | null }) {
  const { scene } = useGLTF(url)

  // Apply DoubleSide once on load so interior surfaces are visible
  useEffect(() => {
    scene.traverse((obj) => {
      if (!(obj as THREE.Mesh).isMesh) return
      const mats = Array.isArray((obj as THREE.Mesh).material)
        ? ((obj as THREE.Mesh).material as THREE.Material[])
        : [(obj as THREE.Mesh).material as THREE.Material]
      mats.forEach((m) => { m.side = THREE.DoubleSide })
    })
  }, [scene])

  // Apply color whenever activeColor changes
  useEffect(() => {
    if (!activeColor) return
    const color = new THREE.Color(activeColor)
    scene.traverse((obj) => {
      if (!(obj as THREE.Mesh).isMesh) return
      const mats = Array.isArray((obj as THREE.Mesh).material)
        ? ((obj as THREE.Mesh).material as THREE.Material[])
        : [(obj as THREE.Mesh).material as THREE.Material]
      mats.forEach((m) => {
        if (SKIP_KEYWORDS.some((kw) => m.name.toLowerCase().includes(kw))) return
        if ((m as THREE.MeshStandardMaterial).color) {
          ;(m as THREE.MeshStandardMaterial).color.set(color)
          m.needsUpdate = true
        }
      })
    })
  }, [scene, activeColor])

  return <primitive object={scene} dispose={null} />
}

export default function ModelViewerComponent({ modelUrl }: Props) {
  const [activeColor, setActiveColor] = useState<string | null>(null)

  return (
    <div className="relative w-screen h-screen bg-neutral-100">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => window.history.back()}
        className="absolute top-4 left-4 z-20 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 backdrop-blur shadow border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-white transition"
      >
        ← Back
      </button>

      <Canvas camera={{ fov: 50, near: 0.01 }} style={{ width: '100%', height: '100%' }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={1} />
        <Suspense
          fallback={
            <Html center>
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full border-[3px] border-neutral-300 border-t-neutral-600 animate-spin" />
                <span className="text-sm font-medium text-neutral-500">Loading model…</span>
              </div>
            </Html>
          }
        >
          {/* Bounds auto-fits camera to the model on first load */}
          <Bounds fit clip observe margin={1.5}>
            <Model url={modelUrl} activeColor={activeColor} />
          </Bounds>
          <Environment preset="city" />
        </Suspense>
        <OrbitControls makeDefault enableDamping minDistance={0} />
      </Canvas>

      {/* Color Panel */}
      <div className="fixed bottom-0 left-0 right-0 z-20 flex justify-center px-4 pb-4">
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/90 backdrop-blur shadow-lg border border-neutral-200">
          <span className="text-xs font-medium text-neutral-500 mr-1">Color</span>
          {COLORS.map((c) => (
            <button
              key={c.hex}
              type="button"
              title={c.label}
              onClick={() => setActiveColor(c.hex)}
              className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 active:scale-95"
              style={{
                backgroundColor: c.hex,
                borderColor: activeColor === c.hex ? '#000' : 'transparent',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
