import { getPayload } from 'payload'
import config from '@/payload.config'
import type { CollectionSlug } from 'payload'

export async function getSceneById(id: string) {
  const payload = await getPayload({ config })
  try {
    return await payload.findByID({ collection: 'scenes' as CollectionSlug, id, depth: 0 })
  } catch {
    return null
  }
}
