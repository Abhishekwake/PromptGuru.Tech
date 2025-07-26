import withPWA from 'next-pwa'
import type { NextConfig } from 'next'

const baseConfig: NextConfig = {
  reactStrictMode: true,

  eslint: {
    ignoreDuringBuilds: true
  }

  // ✅ Remove serverActions or other experimental keys that are not strictly typed
}

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
})(baseConfig)
