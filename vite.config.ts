import { defineConfig } from 'vite'
import path from 'path'
import banner from 'vite-plugin-banner'
import commonjsExternals from 'vite-plugin-commonjs-externals'
import cjsExternalsRegexp from './scripts/cjsExternalsRegexp'
import pkg from './package.json'

const resolve = (dir: string): string => path.resolve(__dirname, dir)

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: 'dist',
    lib: {
      entry: resolve('src/main.ts'),
      name: 'preset',
      formats: ['cjs'],
      fileName: () => `${pkg.name}.js`,
    },
    minify: true,
  },
  resolve: {
    alias: {
      '@': resolve('src'),
      '@core': resolve('src/core'),
      '@libs': resolve('src/libs'),
    },
  },
  plugins: [
    banner(
      `#!/usr/bin/env node\n\n/**\n * name: ${pkg.name}\n * version: v${pkg.version}\n * description: ${pkg.description}\n * author: ${pkg.author}\n * homepage: ${pkg.homepage}\n */\n`
    ),
    commonjsExternals({
      externals: ['fs', 'os', 'path', 'child_process', cjsExternalsRegexp],
    }),
  ],
})
