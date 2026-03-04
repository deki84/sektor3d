// Szenen-CRUD via Payload Local API
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function GET() {
  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({ collection: 'scenes', limit: 200, depth: 0 })
  return NextResponse.json(docs)
}

export async function POST(request: Request) {
  try {
    const { title, cover } = await request.json()
    const payload = await getPayload({ config: configPromise })

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const doc = await payload.create({
      collection: 'scenes',
      data: { title, cover: cover ?? '', slug, viewerType: 'gltf', scene_uuid: slug },
    })

    return NextResponse.json(doc, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 400 })
  }
}
