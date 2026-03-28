'use client'

import { useEffect, useRef, useState } from 'react'

// ─── TypeScript declarations for the model-viewer web component ────
interface Props {
  modelUrl: string
}
const COLORS = [
  { label: 'Schwarz', hex: '#1a1a1a' },
  { label: 'Weiß', hex: '#f5f5f5' },
  { label: 'Silber', hex: '#c0c0c0' },
  { label: 'Rot', hex: '#c0392b' },
  { label: 'Blau', hex: '#1a3a6b' },
  { label: 'Gold', hex: '#c8a415' },
]

export default function ModelViewerComponent({ modelUrl }: Props) {
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [activeColor, setActiveColor] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<HTMLElement | null>(null)

  function applyColor(hex: string) {
    const viewer = viewerRef.current as any
    if (!viewer?.model) return

    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255
    ;(viewer.model.materials as any[]).forEach((mat) => {
      const name = (mat.name ?? '').toLowerCase()

      // nur überspringen was definitiv kein Lack ist
      if (
        name.includes('window') ||
        name.includes('glass') ||
        name.includes('glas') ||
        name.includes('interior') ||
        name.includes('wheel') ||
        name.includes('tire') ||
        name.includes('light') ||
        name.includes('badge') ||
        name.includes('grille') ||
        name.includes('engine') ||
        name.includes('seat') ||
        name.includes('carbon')
      )
        return

      mat.pbrMetallicRoughness.setBaseColorFactor([r, g, b, 1])
    })
    setActiveColor(hex)
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && !customElements.get('model-viewer')) {
      import('@google/model-viewer').catch(console.error)
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // model-viewer is already in the DOM after React rendered it
    const viewer = container.querySelector('model-viewer') as HTMLElement | null
    if (!viewer) return
    viewerRef.current = viewer

    setIsLoading(true)
    setProgress(0)

    const onLoad = () => {
      const v = viewerRef.current as any
      if (v?.model) {
        v.model.materials.forEach((m: any, i: number) => {
          console.log(i, m.name)
        })
      }
      setIsLoading(false)
    }
    const onProgress = (e: Event) => {
      const { totalProgress } = (e as CustomEvent<{ totalProgress: number }>).detail
      setProgress(Math.round(totalProgress * 100))
    }
    const onError = (e: Event) => {
      console.error('model-viewer error:', (e as CustomEvent).detail ?? e)
      setIsLoading(false)
    }

    viewer.addEventListener('load', onLoad)
    viewer.addEventListener('progress', onProgress)
    viewer.addEventListener('error', onError)

    return () => {
      viewer.removeEventListener('load', onLoad)
      viewer.removeEventListener('progress', onProgress)
      viewer.removeEventListener('error', onError)
    }
  }, [modelUrl])

  return (
    <div ref={containerRef} className="relative w-screen h-screen bg-neutral-100">
      {/* back Button */}
      <button
        onClick={() => window.history.back()}
        className="absolute top-4 left-4 z-20 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 backdrop-blur shadow border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-white transition"
      >
        ← Zurück
      </button>

      {/* @ts-expect-error model-viewer is a custom web component */}
      <model-viewer
        src={modelUrl}
        interaction-prompt="none"
        camera-controls
        style={{ width: '100%', height: '100%' }}
      />

      {!isLoading && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/80 backdrop-blur shadow-lg border border-neutral-200">
          <span className="text-xs font-medium text-neutral-500 mr-1">Farbe</span>
          {COLORS.map((c) => (
            <button
              key={c.hex}
              title={c.label}
              onClick={() => applyColor(c.hex)}
              className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: c.hex,
                borderColor: activeColor === c.hex ? '#000' : 'transparent',
              }}
            />
          ))}
        </div>
      )}
      {/* ── Loading overlay ───────────────────────────────────────────────── */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-neutral-100">
          {/* Spinner */}
          <div className="w-10 h-10 rounded-full border-[3px] border-neutral-300 border-t-neutral-600 animate-spin" />
          {/* Progress label */}
          <span className="text-sm font-medium text-neutral-500 tabular-nums tracking-wide">
            {progress > 0 ? `${progress} %` : 'Loading model…'}
          </span>
        </div>
      )}
    </div>
  )
}
