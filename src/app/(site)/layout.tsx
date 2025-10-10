// app/(site)/layout.tsx
import React from 'react'
import '@/app/(frontend)/styles.css'

export const metadata = {
  title: 'sektor3d – Site',
  description: 'sektor3d',
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="flex min-h-screen bg-slate-100 text-slate-900">
        {/* Content */}
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </body>
    </html>
  )
}
