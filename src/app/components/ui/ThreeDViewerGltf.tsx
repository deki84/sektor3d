'use client'
import React, { Suspense, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stage, Html, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url) // loads .gltf + .bin + textures relatively

  useEffect(() => {
    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        materials.forEach((mat) => {
          mat.side = THREE.DoubleSide
        })
      }
    })
  }, [scene])

  return <primitive object={scene} dispose={null} />
}

export default function ThreeDViewerGLTF({ url }: { url: string }) {
  if (!url) return <div>No 3D file found.</div>
  if (!url.endsWith('.gltf') && !url.endsWith('.glb')) return <div>Only .gltf or .glb is supported.</div>

  return (
    <div className="h-[360px] border border-gray-200 rounded-lg overflow-hidden">
      <Canvas camera={{ position: [2, 1.5, 2.5], fov: 50, near: 0.01 }}>
        <ambientLight intensity={0.6} />
        <Suspense
          fallback={
            <Html center>
              <div className="text-xs">Loading 3D…</div>
            </Html>
          }
        >
          <Stage intensity={0.9} environment="city">
            <Model url={url} />
          </Stage>
        </Suspense>
        <OrbitControls makeDefault enableDamping minDistance={0} />
      </Canvas>
    </div>
  )
}
