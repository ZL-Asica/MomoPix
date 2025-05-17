import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['@prisma/client', '.prisma/client'],
}

export default nextConfig

// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
// eslint-disable-next-line import/first
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'
// eslint-disable-next-line ts/no-floating-promises
initOpenNextCloudflareForDev()
