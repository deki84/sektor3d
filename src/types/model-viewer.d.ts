// src/types/model-viewer.ts
import type { DetailedHTMLProps, HTMLAttributes, CSSProperties, ReactNode } from 'react'

export interface ModelViewerElement extends HTMLElement {
  model?: {
    materials: Array<{
      name: string
      pbrMetallicRoughness: {
        setBaseColorFactor: (color: [number, number, number, number]) => void
      }
    }>
  }
  positionAndNormalFromPoint: (
    x: number,
    y: number,
  ) => {
    position: { toString: () => string }
  } | null
}


type ModelViewerProps = DetailedHTMLProps<
  HTMLAttributes<ModelViewerElement> & {
    src?: string
    alt?: string
    'camera-controls'?: boolean | string
    'environment-image'?: string
    'shadow-intensity'?: string
    'shadow-softness'?: string
    exposure?: string
    'tone-mapping'?: string
    loading?: string
    reveal?: string
    style?: CSSProperties
    children?: ReactNode
  },
  ModelViewerElement
>


  declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerProps
    }
  }
}