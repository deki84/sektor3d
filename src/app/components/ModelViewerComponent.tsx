'use client'
import { useEffect, Suspense, useState, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Html, useGLTF, Bounds } from '@react-three/drei'
import * as THREE from 'three'

interface Props { modelUrl: string }

// ─── Body colour palette — common sports-car colours ──────────────────────────
const COLORS = [
  { label: 'Nero',    hex: '#0d0d0d' },  // gloss black
  { label: 'Bianco',  hex: '#f5f5f3' },  // pearl white
  { label: 'Grigio',  hex: '#9aa0a8' },  // metallic silver
  { label: 'Rosso',   hex: '#c8102e' },  // racing red
  { label: 'Blu',     hex: '#003169' },  // deep blue
  { label: 'Arancio', hex: '#e15b04' },  // Lamborghini orange
  { label: 'Verde',   hex: '#1e7840' },  // green
  { label: 'Giallo',  hex: '#f5c800' },  // Lamborghini yellow
]

// ─── Wheel colour palette — common rim colours ─────────────────────────────────
const WHEEL_COLORS: { label: string; hex: string | null }[] = [
  { label: 'Factory',  hex: null      },
  { label: 'Silver',   hex: '#b5b5b5' },
  { label: 'Gunmetal', hex: '#2d3a42' },
  { label: 'Black',    hex: '#111111' },
  { label: 'Gold',     hex: '#c8a415' },
  { label: 'Bronze',   hex: '#8b6914' },
  { label: 'Red',      hex: '#c8102e' },
  { label: 'White',    hex: '#e8e8e8' },
]

// ─── Part classification ───────────────────────────────────────────────────────

// Wheel-group material keywords (English + French + model-specific)
const WHEEL_MAT_KW = ['wheel1a', 'jante', 'crbn_jante', 'pneu', 'pzeo']
function isWheelMat(n: string) {
  const l = n.toLowerCase()
  return WHEEL_MAT_KW.some(k => l.includes(k))
}

// Explicit tyre material (outer rubber — stays black, no user colour)
const TYRE_MAT_KW = ['pneu', 'pzeo', 'tyre', 'tire']
function isTyreMat(n: string) {
  const l = n.toLowerCase()
  return TYRE_MAT_KW.some(k => l.includes(k))
}

// Parts that always keep their factory material — NEVER recoloured
// Covers: brakes (English/French/German) + logos/badges
const FACTORY_KEEP_KW = [
  'brake', 'caliper', 'etrier',            // brake caliper (EN/FR)
  'disc', 'rotor', 'fer.',                 // brake disc  (EN/FR — FER.002 = iron disc)
  'frein', 'bremssattel', 'bremsscheibe', // brake (FR/DE)
  'logo', 'emblem', 'logotype',            // hub logos
  'metalgolden', 'golden',                 // MetalGoldenLogo etc.
]
function isFactoryKeep(mat: string, mesh: string) {
  const s = (mat + ' ' + mesh).toLowerCase()
  return FACTORY_KEEP_KW.some(k => s.includes(k))
}

// Parts excluded from body colour changes
const BODY_SKIP_KW = [
  // All wheel/tyre parts
  'wheel', 'tire', 'tyre', 'rim', 'felge', 'jante', 'pneu', 'pzeo', 'crbn_jante',
  // Brakes
  'brake', 'caliper', 'etrier', 'disc', 'rotor', 'fer.', 'frein', 'bremssattel', 'bremsscheibe',
  // Logos / badges
  'logo', 'emblem', 'badge', 'metalgolden', 'golden',
  // Misc non-body
  'window', 'glass', 'glas', 'interior', 'light', 'lamp', 'exhaust', 'chrome',
]
function isBodySkip(mat: string, mesh: string) {
  const s = (mat + ' ' + mesh).toLowerCase()
  return BODY_SKIP_KW.some(k => s.includes(k))
}

// K-means-lite: 4 clusters via X/Z median split
function cluster4(pts: THREE.Vector3[]): THREE.Vector3[] {
  if (!pts.length) return []
  const xs = pts.map(p => p.x).sort((a, b) => a - b)
  const zs = pts.map(p => p.z).sort((a, b) => a - b)
  const xM = xs[Math.floor(xs.length / 2)]
  const zM = zs[Math.floor(zs.length / 2)]
  const b: THREE.Vector3[][] = [[], [], [], []]
  pts.forEach(p => b[(p.x < xM ? 0 : 1) * 2 + (p.z < zM ? 0 : 1)].push(p))
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
  activeWheelColor: string | null
}

function Model({ url, activeColor, activeWheelColor }: ModelProps) {
  const { scene } = useGLTF(url)

  const rimMat  = useRef<THREE.MeshStandardMaterial | null>(null)
  const tireMat = useRef<THREE.MeshStandardMaterial | null>(null)
  const originalRimMat = useRef<{
    color: THREE.Color; metalness: number; roughness: number
    map: THREE.Texture | null; emissive: THREE.Color
  } | null>(null)

  // ── First load: classify rim / tyre. Brake parts + logos stay factory. ─────
  useEffect(() => {
    if (!scene || rimMat.current) return

    const wheelItems: { mesh: THREE.Mesh; center: THREE.Vector3; explicitTyre: boolean }[] = []

    scene.traverse(node => {
      if (!(node as THREE.Mesh).isMesh) return
      const mesh = node as THREE.Mesh
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      mats.forEach(m => { (m as THREE.Material).side = THREE.DoubleSide })

      // Not a wheel-group mesh → skip
      if (!mats.some(m => isWheelMat((m as THREE.MeshStandardMaterial).name || ''))) return

      // Brake disc / caliper / logo → leave factory material untouched
      const matNames = mats.map(m => (m as THREE.MeshStandardMaterial).name || '').join(' ')
      if (isFactoryKeep(matNames, mesh.name || '')) return

      // Flag if this mesh is explicitly a tyre material
      const explicitTyre = mats.some(m => isTyreMat((m as THREE.MeshStandardMaterial).name || ''))

      mesh.updateWorldMatrix(true, false)
      const box = new THREE.Box3().setFromObject(mesh)
      const c = new THREE.Vector3(); box.getCenter(c)
      wheelItems.push({ mesh, center: c, explicitTyre })
    })

    if (!wheelItems.length) return

    const wheelCenters = cluster4(wheelItems.map(w => w.center))
    const perClusterMax: number[] = wheelCenters.map(() => 0)
    const enriched = wheelItems.map(({ mesh, center, explicitTyre }) => {
      let nearIdx = 0, nearDist = Infinity
      wheelCenters.forEach((wc, i) => {
        const d = center.distanceTo(wc)
        if (d < nearDist) { nearDist = d; nearIdx = i }
      })
      const dist = center.distanceTo(wheelCenters[nearIdx])
      if (dist > perClusterMax[nearIdx]) perClusterMax[nearIdx] = dist
      return { mesh, nearIdx, dist, explicitTyre }
    })

    // Use a RIM mesh (not tyre) as source for material clone
    const rimItem = wheelItems.find(({ explicitTyre }) => !explicitTyre) ?? wheelItems[0]
    const srcMat = (Array.isArray(rimItem.mesh.material)
      ? rimItem.mesh.material[0]
      : rimItem.mesh.material) as THREE.MeshStandardMaterial

    rimMat.current  = srcMat.clone()
    tireMat.current = srcMat.clone()
    originalRimMat.current = {
      color:     srcMat.color.clone(),
      metalness: srcMat.metalness,
      roughness: srcMat.roughness,
      map:       srcMat.map,
      emissive:  srcMat.emissive.clone(),
    }

    // Tyre: deep black rubber, no texture
    tireMat.current.color.set('#080808')
    tireMat.current.metalness = 0.0
    tireMat.current.roughness = 0.96
    tireMat.current.map = null
    tireMat.current.needsUpdate = true

    const TIRE_THRESHOLD = 0.65
    enriched.forEach(({ mesh, nearIdx, dist, explicitTyre }) => {
      const maxD = perClusterMax[nearIdx]
      const isTire = explicitTyre || (maxD > 0 && dist > maxD * TIRE_THRESHOLD)
      const target = isTire ? tireMat.current! : rimMat.current!
      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map(() => target)
      } else {
        mesh.material = target
      }
    })

    console.log(`[sektor3d] ${wheelItems.length} wheel meshes processed`)
  }, [scene])

  // ── Wheel colour — only hue changes, factory finish is preserved ───────────
  useEffect(() => {
    const mat = rimMat.current
    const orig = originalRimMat.current
    if (!mat || !orig) return

    if (activeWheelColor === null) {
      mat.color.copy(orig.color)
      mat.metalness = orig.metalness
      mat.roughness = orig.roughness
      mat.map = orig.map
      mat.emissive.copy(orig.emissive)
    } else {
      mat.map = null
      mat.color.set(new THREE.Color(activeWheelColor))
      mat.metalness = orig.metalness
      mat.roughness = orig.roughness
      mat.emissive.set(new THREE.Color(activeWheelColor)).multiplyScalar(0.04)
    }
    mat.needsUpdate = true
  }, [activeWheelColor])

  // ── Body colour ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeColor || !scene) return
    const color = new THREE.Color(activeColor)
    scene.traverse(node => {
      if (!(node as THREE.Mesh).isMesh) return
      const mesh = node as THREE.Mesh
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      mats.forEach(m => {
        const mat = m as THREE.MeshStandardMaterial
        if (isBodySkip(mat.name || '', mesh.name || '')) return
        if (mat.color) { mat.color.set(color); mat.needsUpdate = true }
      })
    })
  }, [scene, activeColor])

  return <primitive object={scene} dispose={null} />
}

// ─── Swatch helpers ───────────────────────────────────────────────────────────

const FACTORY_SWATCH = 'linear-gradient(135deg,#d8d8d8 0%,#a0a0a0 40%,#d8d8d8 80%,#b0b0b0 100%)'

function swatchStyle(hex: string | null): React.CSSProperties {
  if (hex === null) return { background: FACTORY_SWATCH }
  return { backgroundColor: hex }
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function ModelViewerComponent({ modelUrl }: Props) {
  const [activeColor,      setActiveColor]      = useState<string | null>(null)
  const [activeWheelColor, setActiveWheelColor] = useState<string | null>(null)

  const colorMeta      = COLORS.find(c => c.hex === activeColor)
  const wheelColorMeta = WHEEL_COLORS.find(w => w.hex === activeWheelColor) ?? WHEEL_COLORS[0]

  return (
    <div className="w-screen h-screen bg-[#f0f0f0] flex overflow-hidden">

      {/* ── Canvas ───────────────────────────────────────────────────── */}
      <div className="relative flex-1">
        <button type="button" onClick={() => window.history.back()}
          className="absolute top-4 left-4 z-20 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 backdrop-blur shadow border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-white transition">
          ← Back
        </button>

        <Canvas camera={{ fov: 50, near: 0.01 }} style={{ width: '100%', height: '100%' }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 10, 5]} intensity={1} />
          <Suspense fallback={
            <Html center>
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full border-[3px] border-neutral-300 border-t-neutral-600 animate-spin" />
                <span className="text-sm font-medium text-neutral-500">Loading…</span>
              </div>
            </Html>
          }>
            <Bounds fit clip observe margin={1.5}>
              <Model url={modelUrl} activeColor={activeColor} activeWheelColor={activeWheelColor} />
            </Bounds>
            <Environment preset="city" />
          </Suspense>
          <OrbitControls makeDefault enableDamping minDistance={0} />
        </Canvas>
      </div>

      {/* ── Panel ────────────────────────────────────────────────────── */}
      <aside className="w-[300px] h-full bg-white border-l border-neutral-100 flex flex-col shadow-2xl">
        <div className="px-7 pt-10 pb-6 border-b border-neutral-100">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-neutral-400 uppercase mb-1">Configurator</p>
          <h1 className="text-2xl font-bold text-neutral-900">Vehicle</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-6 flex flex-col gap-8">

          {/* Body */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-semibold tracking-[0.18em] text-neutral-400 uppercase">Body</p>
              {colorMeta && <span className="text-xs font-medium text-neutral-500">{colorMeta.label}</span>}
            </div>
            <div className="flex flex-wrap gap-3">
              {COLORS.map(c => (
                <button
                  key={c.hex}
                  type="button"
                  title={c.label}
                  onClick={() => setActiveColor(c.hex)}
                  style={{ backgroundColor: c.hex }}
                  className={`w-11 h-11 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${
                    activeColor === c.hex
                      ? 'ring-2 ring-neutral-900 ring-offset-2 scale-105 shadow-md'
                      : 'ring-1 ring-neutral-200 hover:ring-neutral-300'
                  }`}
                />
              ))}
            </div>
          </section>

          <div className="h-px bg-neutral-100" />

          {/* Wheels */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-semibold tracking-[0.18em] text-neutral-400 uppercase">Wheels</p>
              <span className="text-xs font-medium text-neutral-500">{wheelColorMeta.label}</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {WHEEL_COLORS.map(wc => (
                <button
                  key={wc.label}
                  type="button"
                  title={wc.label}
                  onClick={() => setActiveWheelColor(wc.hex)}
                  style={swatchStyle(wc.hex)}
                  className={`w-11 h-11 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${
                    activeWheelColor === wc.hex
                      ? 'ring-2 ring-neutral-900 ring-offset-2 scale-105 shadow-md'
                      : 'ring-1 ring-neutral-200 hover:ring-neutral-300'
                  }`}
                />
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
