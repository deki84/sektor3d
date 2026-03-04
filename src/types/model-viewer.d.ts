import type React from 'react'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string
          alt?: string
          'environment-image'?: string
          'shadow-intensity'?: string
          'shadow-softness'?: string
          exposure?: string
          'tone-mapping'?: string
          'camera-controls'?: '' | boolean
          loading?: string
          reveal?: string
          style?: React.CSSProperties
        },
        HTMLElement
      >
    }
  }
}

export {}
