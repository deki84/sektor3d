export const runtime = 'nodejs'

import AdmZip from 'adm-zip'
import path from 'path'
import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

const s3 = new S3Client({
  region: process.env.S3_REGION ?? 'auto',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT } : {}),
})

function sanitize(p: string) {
  return path
    .normalize(p)
    .replace(/^(\.\.(\/|\\|$))+/, '')
    .replace(/^\/+/, '')
}

function getMimeType(filename: string): string {
  const types: Record<string, string> = {
    '.gltf': 'model/gltf+json',
    '.glb': 'model/gltf-binary',
    '.bin': 'application/octet-stream',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
  }
  return types[path.extname(filename).toLowerCase()] ?? 'application/octet-stream'
}

const THUMBNAIL_STEMS = new Set(['thumbnail', 'preview', 'screenshot', 'cover', 'thumb'])
const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp'])

function findCoverEntry(entries: AdmZip.IZipEntry[]): AdmZip.IZipEntry | null {
  let firstRootImage: AdmZip.IZipEntry | null = null
  for (const e of entries) {
    if (e.isDirectory) continue
    const rel = sanitize(e.entryName)
    if (!rel) continue
    const ext = path.extname(rel).toLowerCase()
    if (!IMAGE_EXTS.has(ext)) continue
    const stem = path.basename(rel, ext).toLowerCase()
    if (THUMBNAIL_STEMS.has(stem)) return e
    if (!firstRootImage && !rel.includes('/')) firstRootImage = e
  }
  return firstRootImage
}

export async function POST(req: Request) {
  try {
    const { key, sceneName, originalName, size } = await req.json()

    if (!key || !sceneName) {
      return NextResponse.json({ error: 'Missing key or sceneName' }, { status: 400 })
    }

    const slug = sceneName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    const sceneUuid = crypto.randomUUID()

    const payload = await getPayload({ config })

    const scene = await payload.create({
      collection: 'scenes',
      data: {
        scene_uuid: sceneUuid,
        title: sceneName,
        slug,
        viewerType: 'gltf',
        originalName,
        size,
        status: 'processing',
      } as any,
    })

    // Download ZIP from R2
    const getResult = await s3.send(
      new GetObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key }),
    )
    if (!getResult.Body) {
      await payload.delete({ collection: 'scenes', id: scene.id })
      return NextResponse.json({ error: 'File not found in R2' }, { status: 404 })
    }

    const chunks: Uint8Array[] = []
    for await (const chunk of getResult.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk)
    }
    const buf = Buffer.concat(chunks)

    // Extract ZIP
    const zip = new AdmZip(buf)
    const entries = zip.getEntries()
    const coverEntry = findCoverEntry(entries)

    let mainGLTF: string | null = null

    for (const e of entries) {
      if (e.isDirectory) continue
      const rel = sanitize(e.entryName)
      if (!rel) continue

      if (!mainGLTF && rel.toLowerCase().endsWith('.gltf')) mainGLTF = rel

      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET!,
          Key: `scenes/${slug}/${sceneUuid}/${rel}`,
          Body: e.getData(),
          ContentType: getMimeType(rel),
        }),
      )
    }

    if (!mainGLTF) {
      await payload.delete({ collection: 'scenes', id: scene.id })
      return NextResponse.json({ error: 'No .gltf file found in ZIP' }, { status: 400 })
    }

    const base = process.env.NEXT_PUBLIC_S3_BASE_URL
    const gltfFileUrl = `${base}/scenes/${slug}/${sceneUuid}/${mainGLTF}`
    const cover = coverEntry
      ? `${base}/scenes/${slug}/${sceneUuid}/${sanitize(coverEntry.entryName)}`
      : ''

    const updated = await payload.update({
      collection: 'scenes',
      id: scene.id,
      data: { gltfFileUrl, cover, r2Key: key, status: 'ready' } as any,
    })

    // Remove the original ZIP from R2
    await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key }))

    return NextResponse.json({
      success: true,
      scene_uuid: updated.scene_uuid,
      title: updated.title,
      cover: updated.cover,
      slug: updated.slug,
    })
  } catch (error: any) {
    console.error('Error in /api/import/gltf/complete:', error)
    return NextResponse.json({ error: error.message ?? 'Internal Server Error' }, { status: 500 })
  }
}
