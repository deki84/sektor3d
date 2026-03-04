import React from 'react'
import './styles.css'

export const metadata = {
  title: 'Sektor3D',
  description: 'Sektor3D Platform',
}

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}
