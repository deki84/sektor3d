'use client'
import { useEffect, Suspense, useState, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Html, useGLTF, Bounds } from '@react-three/drei'
import * as THREE from 'three'

interface Props { modelUrl: string }

// ─── Palettes ─────────────────────────────────────────────────────────────────

const COLORS = [
  { label: 'Schwarz', hex: '#1a1a1a' },
  { label: 'Weiß',   hex: '#f5f5f5' },
  { label: 'Silber', hex: '#c0c0c0' },
  { label: 'Rot',    hex: '#FF0000' },
  { label: 'Blau',   hex: '#1a3a6b' },
  { label: 'Gold',   hex: '#c8a415' },
]

interface RimStyle { id: string; label: string; color: string; metalness: number; roughness: number; swatch: string }

const RIM_STYLES: RimStyle[] = [
  { id:'stock',    label:'Stock',       color:'#888888', metalness:0.6, roughness:0.4,  swatch:'linear-gradient(135deg,#a0a0a0 0%,#888 40%,#666 100%)' },
  { id:'chrome',   label:'Chrome',      color:'#e8e8e8', metalness:1.0, roughness:0.05, swatch:'linear-gradient(135deg,#fff 0%,#e8e8e8 30%,#a0a0a0 60%,#e0e0e0 100%)' },
  { id:'matte',    label:'Matte Black', color:'#1a1a1a', metalness:0.3, roughness:0.8,  swatch:'linear-gradient(135deg,#2a2a2a 0%,#1a1a1a 50%,#111 100%)' },
  { id:'gold',     label:'Gold',        color:'#c8a415', metalness:0.9, roughness:0.15, swatch:'linear-gradient(135deg,#f0d060 0%,#c8a415 40%,#8a6d0b 100%)' },
  { id:'bronze',   label:'Bronze',      color:'#8B6914', metalness:0.8, roughness:0.25, swatch:'linear-gradient(135deg,#b8892a 0%,#8B6914 40%,#5a4410 100%)' },
  { id:'gunmetal', label:'Gunmetal',    color:'#3a3a3a', metalness:0.9, roughness:0.2,  swatch:'linear-gradient(135deg,#5a5a5a 0%,#3a3a3a 40%,#1a1a1a 80%,#4a4a4a 100%)' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BODY_SKIP_KW = ['wheel','tire','tyre','rim','felge','caliper','brake',
  'window','glass','glas','interior','light','lamp','badge','exhaust']

function isBodySkip(mat: string, mesh: string) {
  const s = (mat + ' ' + mesh).toLowerCase()
  return BODY_SKIP_KW.some(k => s.includes(k))
}

function isWheel1A(matName: string) {
  return matName.toLowerCase().includes('wheel1a')
}

// K-means-lite: split N points into 4 clusters via X/Z median split
function cluster4(pts: THREE.Vector3[]): THREE.Vector3[] {
  if (!pts.length) return []
  const xs = pts.map(p => p.x).sort((a,b)=>a-b)
  const zs = pts.map(p => p.z).sort((a,b)=>a-b)
  const xM = xs[Math.floor(xs.length/2)]
  const zM = zs[Math.floor(zs.length/2)]
  const b: THREE.Vector3[][] = [[],[],[],[]]
  pts.forEach(p => b[(p.x < xM ? 0:1)*2 + (p.z < zM ? 0:1)].push(p))
  return b.map(g => {
    if (!g.length) return new THREE.Vector3()
    const avg = new THREE.Vector3()
    g.forEach(p => avg.add(p))
    return avg.divideScalar(g.length)
  })
}

// ─── Model ────────────────────────────────────────────────────────────────────

interface ModelProps {
  url: string
  activeColor: string | null
  activeRimStyleId: string
}

function Model({ url, activeColor, activeRimStyleId }: ModelProps) {
  const { scene } = useGLTF(url)

  // Two shared cloned materials: one for rim, one for tire
  const rimMat  = useRef<THREE.MeshStandardMaterial | null>(null)
  const tireMat = useRef<THREE.MeshStandardMaterial | null>(null)
  const originalRimMat = useRef<{
    color: THREE.Color; metalness: number; roughness: number
    map: THREE.Texture | null; emissive: THREE.Color
  } | null>(null)

  // ── First load: geometry-based rim/tire separation ─────────────────────────
  useEffect(() => {
    if (!scene || rimMat.current) return

    // 1. Collect all Wheel1A meshes + their world centers
    const wheelItems: { mesh: THREE.Mesh; center: THREE.Vector3 }[] = []

    scene.traverse(node => {
      if (!(node as THREE.Mesh).isMesh) return
      const mesh = node as THREE.Mesh
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      mats.forEach(m => { (m as THREE.Material).side = THREE.DoubleSide })
      if (!mats.some(m => isWheel1A((m as THREE.MeshStandardMaterial).name || ''))) return

      mesh.updateWorldMatrix(true, false)
      const box = new THREE.Box3().setFromObject(mesh)
      const c = new THREE.Vector3(); box.getCenter(c)
      wheelItems.push({ mesh, center: c })
    })

    if (!wheelItems.length) return

    // 2. Find 4 wheel centers
    const centers = wheelItems.map(w => w.center)
    const wheelCenters = cluster4(centers)

    // 3. For each mesh: simple 3D distance from nearest wheel center.
    //    Tire = outer ring → largest distance. Rim spokes/disc = smaller distance.
    //    No axle direction needed — avoids wrong-axis bugs entirely.
    const perClusterMax: number[] = wheelCenters.map(() => 0)
    const enriched = wheelItems.map(({ mesh, center }) => {
      let nearIdx = 0, nearDist = Infinity
      wheelCenters.forEach((wc, i) => {
        const d = center.distanceTo(wc)
        if (d < nearDist) { nearDist = d; nearIdx = i }
      })
      const dist = center.distanceTo(wheelCenters[nearIdx])
      if (dist > perClusterMax[nearIdx]) perClusterMax[nearIdx] = dist
      return { mesh, nearIdx, dist }
    })

    // 4. Clone the shared material once
    const srcMat = (Array.isArray(wheelItems[0].mesh.material)
      ? wheelItems[0].mesh.material[0]
      : wheelItems[0].mesh.material) as THREE.MeshStandardMaterial

    rimMat.current  = srcMat.clone()
    tireMat.current = srcMat.clone()

    originalRimMat.current = {
      color:     srcMat.color.clone(),
      metalness: srcMat.metalness,
      roughness: srcMat.roughness,
      map:       srcMat.map,
      emissive:  srcMat.emissive.clone(),
    }

    // Tire: force deep black, no texture, no metal
    tireMat.current.color.set('#080808')
    tireMat.current.metalness = 0.0
    tireMat.current.roughness = 0.96
    tireMat.current.map = null
    tireMat.current.needsUpdate = true

    // 5. Assign materials — TIRE = outer 65%+ of max dist, RIM = inner 65%
    //    Guard: if maxDist = 0 (empty cluster), treat everything as rim
    const TIRE_THRESHOLD = 0.65
    enriched.forEach(({ mesh, nearIdx, dist }) => {
      const maxD = perClusterMax[nearIdx]
      const isTire = maxD > 0 && dist > maxD * TIRE_THRESHOLD
      const target = isTire ? tireMat.current! : rimMat.current!
      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map(() => target)
      } else {
        mesh.material = target
      }
    })

    const tireCount = enriched.filter(e => perClusterMax[e.nearIdx] > 0 && e.dist > perClusterMax[e.nearIdx] * TIRE_THRESHOLD).length
    console.log(`[sektor3d] ${wheelItems.length} Wheel1A meshes → ${tireCount} tire / ${wheelItems.length - tireCount} rim  perClusterMax=${perClusterMax.map(v=>v.toFixed(3))}`)

  }, [scene])

  // ── Rim color update ──────────────────────────────────────────────────────
  useEffect(() => {
    const mat = rimMat.current
    const orig = originalRimMat.current
    if (!mat) return

    const style = RIM_STYLES.find(s => s.id === activeRimStyleId)
    if (!style || style.id === 'stock') {
      if (orig) {
        mat.color.copy(orig.color)
        mat.metalness = orig.metalness
        mat.roughness = orig.roughness
        mat.map = orig.map
        mat.emissive.copy(orig.emissive)
      }
    } else {
      mat.map = null
      mat.color.set(new THREE.Color(style.color))
      mat.metalness = style.metalness
      mat.roughness = style.roughness
      mat.emissive.set(new THREE.Color(style.color)).multiplyScalar(0.1)
    }
    mat.needsUpdate = true
  }, [activeRimStyleId])

  // ── Body color ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeColor || !scene) return
    const color = new THREE.Color(activeColor)
    scene.traverse(node => {
      if (!(node as THREE.Mesh).isMesh) return
      const mesh = node as THREE.Mesh
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      mats.forEach(m => {
        const mat = m as THREE.MeshStandardMaterial
        if (isBodySkip(mat.name||'', mesh.name||'')) return
        if (mat.color) { mat.color.set(color); mat.needsUpdate = true }
      })
    })
  }, [scene, activeColor])

  return <primitive object={scene} dispose={null} />
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function ModelViewerComponent({ modelUrl }: Props) {
  const [activeColor,      setActiveColor]      = useState<string | null>(null)
  const [activeRimStyleId, setActiveRimStyleId] = useState('stock')

  const colorMeta = COLORS.find(c => c.hex === activeColor)
  const rimMeta   = RIM_STYLES.find(r => r.id === activeRimStyleId)

  return (
    <div className="w-screen h-screen bg-[#f0f0f0] flex overflow-hidden">

      {/* ── Canvas ───────────────────────────────────────────────────── */}
      <div className="relative flex-1">
        <button type="button" onClick={() => window.history.back()}
          className="absolute top-4 left-4 z-20 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 backdrop-blur shadow border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-white transition">
          ← Back
        </button>

        <Canvas camera={{ fov: 50, near: 0.01 }} style={{ width:'100%', height:'100%' }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5,10,5]} intensity={1} />
          <Suspense fallback={
            <Html center>
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full border-[3px] border-neutral-300 border-t-neutral-600 animate-spin" />
                <span className="text-sm font-medium text-neutral-500">Loading…</span>
              </div>
            </Html>
          }>
            <Bounds fit clip observe margin={1.5}>
              <Model url={modelUrl} activeColor={activeColor} activeRimStyleId={activeRimStyleId} />
            </Bounds>
            <Environment preset="city" />
          </Suspense>
          <OrbitControls makeDefault enableDamping minDistance={0} />
        </Canvas>
      </div>

      {/* ── Panel ────────────────────────────────────────────────────── */}
      <aside className="w-[300px] h-full bg-white border-l border-neutral-100 flex flex-col shadow-2xl">
        <div className="px-7 pt-10 pb-6 border-b border-neutral-100">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-neutral-400 uppercase mb-1">Konfigurator</p>
          <h1 className="text-2xl font-bold text-neutral-900">Fahrzeug</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-6 flex flex-col gap-8">

          {/* Karosserie */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-semibold tracking-[0.18em] text-neutral-400 uppercase">Karosserie</p>
              {colorMeta && <span className="text-xs font-medium text-neutral-500">{colorMeta.label}</span>}
            </div>
            <div className="flex flex-wrap gap-3">
              {COLORS.map(c => (
                <button key={c.hex} type="button" title={c.label} onClick={() => setActiveColor(c.hex)}
                  className={`w-11 h-11 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${
                    activeColor === c.hex
                      ? 'ring-2 ring-neutral-900 ring-offset-2 scale-105 shadow-md'
                      : 'ring-1 ring-neutral-200 hover:ring-neutral-300'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </section>

          <div className="h-px bg-neutral-100" />

          {/* Felgen */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-semibold tracking-[0.18em] text-neutral-400 uppercase">Felgen</p>
              {rimMeta && <span className="text-xs font-medium text-neutral-500">{rimMeta.label}</span>}
            </div>
            <div className="flex flex-wrap gap-4">
              {RIM_STYLES.map(rs => (
                <button key={rs.id} type="button" title={rs.label} onClick={() => setActiveRimStyleId(rs.id)}
                  className="group flex flex-col items-center gap-1.5">
                  <div className={`w-11 h-11 rounded-full transition-all duration-200 group-hover:scale-110 group-active:scale-95 ${
                    activeRimStyleId === rs.id
                      ? 'ring-2 ring-neutral-900 ring-offset-2 scale-105 shadow-md'
                      : 'ring-1 ring-neutral-200 group-hover:ring-neutral-300'
                  }`} style={{ background: rs.swatch }} />
                  <span className={`text-[10px] font-medium transition-colors ${
                    activeRimStyleId === rs.id ? 'text-neutral-900' : 'text-neutral-400 group-hover:text-neutral-600'
                  }`}>{rs.label}</span>
                </button>
              ))}
            </div>
          </section>

        </div>

        <div className="px-7 py-5 border-t border-neutral-100">
          <p className="text-[10px] text-neutral-300 text-center tracking-widest uppercase">Drag · Scroll · Pinch</p>
        </div>
      </aside>
    </div>
  )
}
