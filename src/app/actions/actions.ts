'use server'

import { revalidateTag } from 'next/cache'

type Scene = { scene_uuid: string; title: string; cover?: string; slug?: string }

const BASE = process.env.NEXT_PUBLIC_PAYLOAD_URL ?? ''

export async function importScene(newScene: Omit<Scene, 'scene_uuid'>) {
  const res = await fetch(`${BASE}/api/scenes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newScene),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Import fehlgeschlagen (${res.status}): ${text}`)
  }

  const saved: Scene = await res.json()

  if (!saved?.scene_uuid) {
    throw new Error('Import-Antwort enthält keine id')
  }

  revalidateTag('scenes', 'max')
  return saved
}

export async function deleteScene(scene_uuid: string) {
  const res = await fetch(`${BASE}/api/delete-scene/${scene_uuid}`, { method: 'DELETE' })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Löschen fehlgeschlagen (${res.status}): ${text}`)
  }

  revalidateTag('scenes', 'max')
  return true
}
