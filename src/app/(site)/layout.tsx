// app/(site)/layout.tsx – Wrapper für alle Dashboard-Seiten
import React from 'react'
import '@/app/(frontend)/styles.css'

export const metadata = {
  title: 'sektor3d – Dashboard',
  description: 'sektor3d 3D Asset Management',
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      {/* Dunkler Hintergrund, damit kein weißer Blitz beim Laden */}
      <body className="bg-slate-950 text-slate-100">
        {children}
      </body>
    </html>
  )
}
