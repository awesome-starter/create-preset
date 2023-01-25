import { writeFileSync } from '@withtypes/fs-extra'
import { resolve } from 'path'
import pkg from '../../package.json'

/**
 * This package no need declare file.
 * But I like to show the `TS` icon after the package name on the npmjs website.
 */
async function run() {
  const content = `export {};`
  const rootPath = resolve(__dirname, '../..')
  const output = resolve(rootPath, `./dist/${pkg.name}.d.ts`)
  writeFileSync(output, content)
}
run().catch((e) => {
  console.log('run', e)
})
