import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  devIndicators: false,
  distDir: process.env.NODE_ENV === 'production' ? '.next-build' : '.next-frontend',
  images: { unoptimized: true },
}

export default nextConfig
