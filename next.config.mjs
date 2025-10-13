// next.config.mjs  (oder .js – passt)
import { withPayload } from '@payloadcms/next/withPayload'
import redirects from './redirects.mjs'

// Quelle festlegen (öffentlich oder Vercel-URL, sonst localhost)
const SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000')

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: SERVER_URL
      ? (() => {
          const u = new URL(SERVER_URL)
          return [{ protocol: u.protocol.replace(':', ''), hostname: u.hostname }]
        })()
      : [], // nichts, wenn keine URL
  },
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    return config
  },
  output: 'standalone',
  reactStrictMode: true,
  redirects,
  experimental: { serverActions: { bodySizeLimit: '100mb' } },
},
async rewrites() {S
  return [
    { source: '/', destination: '/login' },
  ]
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
