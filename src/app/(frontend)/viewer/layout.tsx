import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'sektor3d – Viewer',
  description: '3D Scene Viewer',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
  },
}

// model-viewer is loaded on demand by ModelViewerComponent via a guarded
// dynamic import, so no CDN script tag is needed here.
export default function ViewerLayout({ children }: { children: React.ReactNode }) {
  return <div className="fixed inset-0 overflow-hidden bg-neutral-100">{children}</div>
}
