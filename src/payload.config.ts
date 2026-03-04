// S3-Storage-Adapter für Media-Uploads
import { s3Storage } from '@payloadcms/storage-s3'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { resendAdapter } from '@payloadcms/email-resend'

import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users.ts'
import { Media } from './collections/Media.ts'
import { Scenes } from './collections/Scenes.ts'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    theme: 'light',
    routes: {
      reset: '/reset-password', // ← deine eigene Seite statt /admin/reset
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Scenes],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString:
        process.env.DATABASE_URL ||
        process.env.DATABASE_URL_UNPOOLED ||
        process.env.DATABASE_URI ||
        '',
      ssl: { rejectUnauthorized: false },
    },
  }),

  email: resendAdapter({
    defaultFromAddress: process.env.SMTP_FROM!,
    defaultFromName: 'Sektor3D',
    apiKey: process.env.RESEND_API_KEY!,
  }),

  sharp,
  plugins: [
    // Media-Uploads gehen direkt in S3
    s3Storage({
      collections: { media: true },
      bucket: process.env.S3_BUCKET!,
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID!,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
        },
        region: process.env.S3_REGION ?? 'auto',
        ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT } : {}),
      },
    }),
  ],
})
