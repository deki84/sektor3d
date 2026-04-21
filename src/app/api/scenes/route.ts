import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

type SceneCreateData = {
  title: string
  cover: string
  slug: string
  viewerType: 'gltf'
  scene_uuid: string
  createdBy?: number
}

export async function GET() {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({ collection: 'scenes', limit: 200, depth: 0 })
  return NextResponse.json(docs)
}

export async function POST(request: Request) {
  try {
    const { title, cover } = await request.json()
    const payload = await getPayload({ config: configPromise })
    const { user } = await payload.auth({ headers: request.headers })

    const slug = `${title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')}-${Date.now()}`

    const doc = await payload.create({
      collection: 'scenes',
      data: {
        title,
        cover: cover ?? '',
        slug,
        viewerType: 'gltf',
        scene_uuid: slug,
        createdBy: user?.id,
      } satisfies SceneCreateData as SceneCreateData,
    })

    return NextResponse.json(doc, { status: 201 })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 })
  }
}
