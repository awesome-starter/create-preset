import { withBlackworkDocs } from '@blackwork/docs/next'
import type { NextConfig } from 'next'
import { resolve } from 'node:path'

const isStaticExport = process.env.NEXT_OUTPUT === 'export'
const distDir = process.env.NEXT_DIST_DIR

const nextConfig: NextConfig = {
  turbopack: {
    root: resolve(process.cwd()),
  },
  outputFileTracingRoot: resolve(process.cwd()),
  distDir: distDir || undefined,
  images: {
    unoptimized: true,
  },
  output: isStaticExport ? 'export' : undefined,
  trailingSlash: isStaticExport,
  transpilePackages: ['blackwork'],
}

export default withBlackworkDocs()(nextConfig)
