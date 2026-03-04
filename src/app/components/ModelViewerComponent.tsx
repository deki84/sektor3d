'use client'

import { useEffect, useRef, useState } from 'react'

// ─── TypeScript declarations for the model-viewer web component ───────────────
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string
          alt?: string
          /** HDR environment: "neutral" | "legacy" | URL to .hdr/.env */
          'environment-image'?: string
          /** 0 – 1 */
          'shadow-intensity'?: string
          /** 0 – 1 */
          'shadow-softness'?: string
          /** scene exposure, e.g. "1.0" */
          exposure?: string
          /** "commerce" | "aces" (model-viewer ≥ 3.5) */
          'tone-mapping'?: string
          /** present = orbit controls enabled */
          'camera-controls'?: '' | boolean
          /** "auto" (default) | "interaction" | "manual" */
          reveal?: string
          /** "eager" | "lazy" */
          loading?: string
        },
        HTMLElement
      >
    }
  }
}
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  modelUrl: string
}

export default function ModelViewerComponent({ modelUrl }: Props) {
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // model-viewer is already in the DOM after React rendered it
    const viewer = container.querySelector('model-viewer') as HTMLElement | null
    if (!viewer) return

    setIsLoading(true)
    setProgress(0)

    const onLoad = () => setIsLoading(false)
    const onProgress = (e: Event) => {
      const { totalProgress } = (e as CustomEvent<{ totalProgress: number }>).detail
      setProgress(Math.round(totalProgress * 100))
    }
    const onError = () => setIsLoading(false)

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

      {/* ── model-viewer ──────────────────────────────────────────────────── */}
      {/*
        Attributes used:
          environment-image="neutral"  → built-in HDR neutral preset
          shadow-intensity="1"         → full ground shadow
          shadow-softness="0.8"        → soft shadow blur
          exposure="1.0"               → scene exposure
          tone-mapping="aces"          → ACES filmic tone mapping (≥ mv 3.5)
          camera-controls=""           → orbit / pan / zoom enabled
          loading="eager"              → start fetching immediately
          reveal="auto"                → unhide as soon as loaded
      */}
      <model-viewer
        src={modelUrl}
        alt="3D Model"
        environment-image="neutral"
        shadow-intensity="1"
        shadow-softness="0.8"
        exposure="1.0"
        tone-mapping="aces"
        camera-controls=""
        loading="eager"
        reveal="auto"
        style={{ width: '100vw', height: '100vh', backgroundColor: 'transparent' }}
      />
    </div>
  )
}
