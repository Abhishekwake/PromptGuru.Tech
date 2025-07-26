declare module 'next-pwa' {
  import { NextConfig } from 'next'

  type PWAOptions = {
    dest: string
    disable?: boolean
    register?: boolean
    skipWaiting?: boolean
    buildExcludes?: string[]
    [key: string]: any
  }

  function withPWA(options: PWAOptions): (nextConfig: NextConfig) => NextConfig

  export default withPWA
}
