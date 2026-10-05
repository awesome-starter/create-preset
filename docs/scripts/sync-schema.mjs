import { copyFile, mkdir } from 'node:fs/promises'

const source = new URL('../../schema/preset.schema.json', import.meta.url)
const directory = new URL('../public/schema/', import.meta.url)
const destination = new URL('preset.schema.json', directory)

await mkdir(directory, { recursive: true })
await copyFile(source, destination)
