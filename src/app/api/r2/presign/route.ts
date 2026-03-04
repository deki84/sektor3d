import { NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import crypto from 'crypto'

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
  const { filename, contentType } = await req.json()

  if (!filename || !contentType) {
    return NextResponse.json({ error: 'Missing filename/contentType' }, { status: 400 })
  }

  // Key im Bucket (sauber & eindeutig)
  const ext = filename.split('.').pop() || 'bin'
  const key = `uploads/${crypto.randomUUID()}.${ext}`

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET!,
    Key: key,
    ContentType: contentType,
  })

  const url = await getSignedUrl(s3, command, { expiresIn: 60 * 5 }) // 5 min

  return NextResponse.json({ url, key })
}
