import { access } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { processExportedDocs } from '@blackwork/docs'
import { indexSite } from '@blackwork/search'

const scriptPath = fileURLToPath(import.meta.url)
const appRoot = resolve(dirname(scriptPath), '..')
const sitePath = resolve(appRoot, '.next-static')

await access(sitePath)
await processExportedDocs({
  outDir: '.next-static',
  rootDir: appRoot,
})

const result = await indexSite({
  site: sitePath,
})

if (result.indexingErrors.length > 0) {
  console.warn('[preset-search] Indexing warnings:')
  for (const error of result.indexingErrors) {
    console.warn(`- ${error}`)
  }
}

if (result.writeErrors.length > 0) {
  console.warn('[preset-search] Write warnings:')
  for (const error of result.writeErrors) {
    console.warn(`- ${error}`)
  }
}

console.log(
  `[preset-search] Indexed ${result.pageCount} pages into ${result.writeOutputPath}`,
)
