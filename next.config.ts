import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  devIndicators: false,
  distDir: process.env.NODE_ENV === 'production' ? '.next-build' : '.next-frontend',
  images: { unoptimized: true },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*',
      },
    ]
  },
}

export default nextConfig
