// Delete scene + S3 files via Payload Local API
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3'

const s3 = new S3Client({
  region: process.env.S3_REGION ?? 'auto',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT } : {}),
})

export async function DELETE(_req: Request, ctx: { params: Promise<{ scene_uuid: string }> }) {
  const { scene_uuid } = await ctx.params
  const payload = await getPayload({ config: configPromise })

  // Find scene by UUID
  const { docs } = await payload.find({
    collection: 'scenes',
    where: { scene_uuid: { equals: scene_uuid } },
    limit: 1,
    depth: 0,
  })

  if (!docs.length) {
    return NextResponse.json({ ok: true, message: 'Scene not exists.' }, { status: 200 })
  }

  const scene = docs[0]
  const slug = scene.slug ?? ''
  const prefix = `scenes/${slug ? `${slug}/` : ''}${scene_uuid}/`

  // List and delete S3 files in the folder
  const listed = await s3.send(
    new ListObjectsV2Command({ Bucket: process.env.S3_BUCKET!, Prefix: prefix }),
  )
  if (listed.Contents?.length) {
    await s3.send(
      new DeleteObjectsCommand({
        Bucket: process.env.S3_BUCKET!,
        Delete: { Objects: listed.Contents.map((o: { Key?: string }) => ({ Key: o.Key! })) },
      }),
    )
  }

  // Delete scene from DB
  await payload.delete({ collection: 'scenes', id: scene.id })

  return NextResponse.json({ ok: true })
}
