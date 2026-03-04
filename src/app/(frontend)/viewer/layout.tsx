import type { Metadata } from 'next'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'sektor3d – Viewer',
  description: '3D Scene Viewer',
}

/**
 * Viewer layout — loads the model-viewer script only for /viewer routes.
 * Using afterInteractive so it doesn't block the initial render; model-viewer
 * upgrades the <model-viewer> custom element once the library is ready.
 */
export default function ViewerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        type="module"
        src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"
        strategy="afterInteractive"
      />
      <div className="fixed inset-0 overflow-hidden bg-neutral-100">{children}</div>
    </>
  )
}
