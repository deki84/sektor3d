'use client'
import { useEffect } from 'react'

const LoadModelViewer = () => {
  useEffect(() => {
    const existing = document.querySelector('script[src*="model-viewer"]')
    if (!existing) {
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js'
      script.type = 'module'
      document.head.appendChild(script)
    }
  }, [])

  return null
}

export default LoadModelViewer
