'use client'
import { useEffect } from 'react'

const LoadModelViewer = () => {
  useEffect(() => {
    if (typeof window !== 'undefined' && !customElements.get('model-viewer')) {
      import('@google/model-viewer').catch(console.error)
    }
  }, [])

  return null
}

export default LoadModelViewer
