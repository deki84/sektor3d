// ZIP import: files directly to S3, scene via Payload Local API
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import AdmZip from 'adm-zip'
import path from 'path'
import { NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

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

// Finds a preview image in the ZIP.
// Priority 1: file with a known preview name (thumbnail, preview, …).
// Priority 2: first image in the root directory (no subdirectory).
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
    if (THUMBNAIL_STEMS.has(stem)) return e // return immediately on match

    if (!firstRootImage && !rel.includes('/')) firstRootImage = e
  }

  return firstRootImage
}

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const name = String(form.get('sceneName') || form.get('name') || '').trim()
    const file = (form.get('file') || form.get('zip')) as File | null

    if (!name || !file) {
      return NextResponse.json({ error: 'name + zip required' }, { status: 400 })
    }

    const payload = await getPayload({ config: configPromise })
    const { user } = await payload.auth({ headers: req.headers }) // ← neu
    const sceneUuid = crypto.randomUUID()
    const slug = `${name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')}-${Date.now()}`

    const scene = await payload.create({
      collection: 'scenes',
      data: {
        title: name,
        slug,
        scene_uuid: sceneUuid,
        viewerType: 'gltf',
        cover: '',
        ...(user?.id ? { createdBy: user.id } : {}), // ← neu
      },
    })

    // Extract ZIP and upload files to S3
    const buf = Buffer.from(await file.arrayBuffer())
    const zip = new AdmZip(buf)
    const entries = zip.getEntries()

    // Find preview image (before upload loop, so we know the key)
    const coverEntry = findCoverEntry(entries)

    let mainGLTF: string | null = null

    for (const e of entries) {
      if (e.isDirectory) continue
      const rel = sanitize(e.entryName)
      if (!rel) continue

      if (!mainGLTF && rel.toLowerCase().endsWith('.gltf')) mainGLTF = rel

      const key = `scenes/${slug}/${sceneUuid}/${rel}`
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET!,
          Key: key,
          Body: e.getData(),
          ContentType: getMimeType(rel),
        }),
      )
    }

    if (!mainGLTF) {
      await payload.delete({ collection: 'scenes', id: scene.id })
      return NextResponse.json({ error: 'no .gltf found in ZIP' }, { status: 400 })
    }

    // Build public URL for the main GLTF
    const gltfKey = `scenes/${slug}/${sceneUuid}/${mainGLTF}`
    const gltfUrl = `${process.env.NEXT_PUBLIC_S3_BASE_URL}/${gltfKey}`

    // Cover URL: preview image from ZIP (if available), otherwise empty
    const coverUrl = coverEntry
      ? `${process.env.NEXT_PUBLIC_S3_BASE_URL}/scenes/${slug}/${sceneUuid}/${sanitize(coverEntry.entryName)}`
      : ''

    // Update scene with final URL
    const updated = await payload.update({
      collection: 'scenes',
      id: scene.id,
      data: { gltfFileUrl: gltfUrl, cover: coverUrl },
    })

    return NextResponse.json(
      {
        scene_uuid: updated.scene_uuid,
        title: updated.title,
        cover: updated.cover,
        slug: updated.slug,
      },
      { status: 200 },
    )
  } catch (e: unknown) {
    console.error('Import Error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}
