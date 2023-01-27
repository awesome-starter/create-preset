import { defineConfig } from 'vite'
import path from 'path'
import banner from 'vite-plugin-banner'
import commonjsExternals from 'vite-plugin-commonjs-externals'
import { cjsExternalsRegExp } from './scripts/build/options'
import pkg from './package.json'

const resolve = (dir: string): string => path.resolve(__dirname, dir)

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: 'dist',
    lib: {
      entry: resolve('src/index.ts'),
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
      [
        `#!/usr/bin/env node`,
        ``,
        `/**`,
        ` * name: ${pkg.name}`,
        ` * version: v${pkg.version}`,
        ` * description: ${pkg.description}`,
        ` * author: ${pkg.author}`,
        ` * homepage: ${pkg.homepage}`,
        ` * license: ${pkg.license}`,
        ` */`,
      ].join('\n')
    ),
    commonjsExternals({
      externals: ['fs', 'os', 'path', 'child_process', cjsExternalsRegExp()],
    }),
  ],
})
