'use server'

import { revalidateTag } from 'next/cache'

type Scene = { scene_uuid: string; title: string; cover?: string; slug?: string }

// Relativ fetchen vermeidet CORS/Env-Mismatches.
// Falls deine API extern läuft, kannst du BASE wieder auf ENV umstellen.
const BASE = process.env.NEXT_PUBLIC_SERVER_URL ?? ''

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

  // Muss eine id haben, sonst Karte nicht stabil renderbar
  if (!saved?.scene_uuid) {
    throw new Error('Import-Antwort enthält keine id')
  }

  // Tag-Cache invalidieren (gehört zur Page-Fetch-Konfiguration)
  revalidateTag('scenes')

  return saved
}

export async function deleteScene(scene_uuid: string) {
  const res = await fetch(`${BASE}/api/delete-scene/${scene_uuid}`, { method: 'DELETE' })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Löschen fehlgeschlagen (${res.status}): ${text}`)
  }

  revalidateTag('scenes')
  return true
}
