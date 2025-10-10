import { getPayload } from 'payload'
import config from '@/payload.config'

export async function getSceneById(id: string) {
  const payload = await getPayload({ config })
  try {
    return await payload.findByID({ collection: 'scenes', id, depth: 0 })
  } catch {
    return null
  }
}
