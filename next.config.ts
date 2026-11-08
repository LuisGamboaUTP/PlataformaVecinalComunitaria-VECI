import type { NextConfig } from 'next'

const backendUrl =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  ''

const nextConfig: NextConfig = {
  devIndicators: false,
  distDir: process.env.VERCEL
    ? undefined
    : process.env.NODE_ENV === 'production'
      ? '.next-build'
      : '.next-frontend',
  images: { unoptimized: true },
  async rewrites() {
    if (!backendUrl) {
      return []
    }
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl.replace(/\/$/, '')}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
