export const runtime = 'nodejs'

type SceneData = {
  scene_uuid?: string
  title?: string
  slug?: string
  viewerType?: 'gltf' | 'shapespark' | 'iframe'
  originalName?: string
  size?: number
  status?: string
  createdBy?: number
  gltfFileUrl?: string
  cover?: string
  r2Key?: string
  fileHash?: string
}

import AdmZip from 'adm-zip'
import path from 'path'
import crypto from 'crypto'
import { getPayload } from 'payload'
import config from '@payload-config'
import { NextResponse } from 'next/server'
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'

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

    const sceneUuid = crypto.randomUUID()
    const slug = `${sceneName.toLowerCase().replace(/\s+/g, '-')}-${sceneUuid.slice(0, 8)}`

    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: req.headers })

    if (user) {
      const existing = await payload.find({
        collection: 'scenes',
        where: {
          and: [
            { title: { equals: sceneName } },
            { createdBy: { equals: user.id } },
          ],
        },
        overrideAccess: true,
        limit: 1,
      })
      if (existing.totalDocs > 0) {
        return NextResponse.json(
          { error: 'You already have a scene with this name.' },
          { status: 409 },
        )
      }
    }

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
        ...(user?.id ? { createdBy: user.id } : {}),
      } satisfies SceneData as SceneData,
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
    const fileHash = crypto.createHash('sha256').update(buf).digest('hex')

    if (user) {
      const hashDuplicate = await payload.find({
        collection: 'scenes',
        where: {
          and: [
            { fileHash: { equals: fileHash } },
            { createdBy: { equals: user.id } },
          ],
        },
        overrideAccess: true,
        limit: 1,
      })
      if (hashDuplicate.totalDocs > 0) {
        await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key }))
        await payload.delete({ collection: 'scenes', id: scene.id })
        return NextResponse.json(
          { error: `This file has already been imported as "${hashDuplicate.docs[0].title}".` },
          { status: 409 },
        )
      }
    }

    // Extract ZIP
    const zip = new AdmZip(buf)
    const entries = zip.getEntries()
    const coverEntry = findCoverEntry(entries)

    let mainGLTF: string | null = null
    let mainGLB: string | null = null

    for (const e of entries) {
      if (e.isDirectory) continue
      const rel = sanitize(e.entryName)
      if (!rel) continue

      const lower = rel.toLowerCase()
      if (!mainGLTF && lower.endsWith('.gltf')) mainGLTF = rel
      if (!mainGLB && lower.endsWith('.glb')) mainGLB = rel

      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET!,
          Key: `scenes/${slug}/${sceneUuid}/${rel}`,
          Body: e.getData(),
          ContentType: getMimeType(rel),
        }),
      )
    }

    if (!mainGLTF && !mainGLB) {
      await payload.delete({ collection: 'scenes', id: scene.id })
      return NextResponse.json({ error: 'No .gltf or .glb file found in ZIP' }, { status: 400 })
    }

    const base = process.env.NEXT_PUBLIC_S3_BASE_URL
    // Prefer .gltf; fall back to .glb (uploaded directly, no pipeline processing needed)
    const modelFile = mainGLTF ?? mainGLB!
    const gltfFileUrl = `${base}/scenes/${slug}/${sceneUuid}/${modelFile}`
    const cover = coverEntry
      ? `${base}/scenes/${slug}/${sceneUuid}/${sanitize(coverEntry.entryName)}`
      : ''

    const updated = await payload.update({
      collection: 'scenes',
      id: scene.id,
      data: { gltfFileUrl, cover, r2Key: key, status: 'ready', fileHash } satisfies SceneData as SceneData,
    })

    // Remove the original ZIP from R2
    await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key }))

    return NextResponse.json({
      success: true,
      scene_uuid: updated.scene_uuid,
      title: updated.title,
      cover: updated.cover,
      gltfFileUrl: updated.gltfFileUrl,
      slug: updated.slug,
    })
  } catch (error: unknown) {
    console.error('Error in /api/import/gltf/complete:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 })
  }
}
