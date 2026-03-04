import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

export const runtime = 'nodejs'

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function POST(req: Request) {
  try {
    const { key, sceneName, originalName, size } = await req.json()

    if (!key || !sceneName) {
      return NextResponse.json({ error: 'Missing key or sceneName' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    const scene = await payload.create({
      collection: 'scenes',
      data: {
        scene_uuid: crypto.randomUUID(),
        title: sceneName,
        slug: sceneName.toLowerCase().replace(/\s+/g, '-'),
        viewerType: 'gltf',
        // @ts-ignore - Falls generate:types noch nicht durchgelaufen ist
        r2Key: key,
        originalName,
        size,
        status: 'uploaded',
      } as any,
    })

    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
    })

    const result = await s3.send(command)

    if (!result.Body) {
      return NextResponse.json({ error: 'File not found in R2' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      sceneId: scene.id,
      message: 'Import erfolgreich gestartet',
    })
  } catch (error) {
    console.error('Error in /api/import/gltf/complete:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
