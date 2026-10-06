import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { docsContentConfig } from '../../../content.config'
import { docsConfig } from '../../../docs.config'

const packageJson = JSON.parse(
  readFileSync(join(process.cwd(), 'package.json'), 'utf8'),
) as { dependencies?: Record<string, string>; scripts?: Record<string, string> }

describe('Create Preset website contract', () => {
  test('uses the published Blackwork docs packages', () => {
    expect(packageJson.dependencies).toMatchObject({
      '@blackwork/docs': '^0.6.0',
      '@blackwork/search': '^0.1.1',
      blackwork: '^0.14.0',
    })
    expect(Object.values(packageJson.dependencies ?? {})).not.toContain(
      'workspace:*',
    )
  })

  test('builds a searchable static export', () => {
    expect(packageJson.scripts?.build).toContain('NEXT_OUTPUT=export')
    expect(packageJson.scripts?.build).toContain('pnpm run build:search')
    expect(packageJson.scripts?.['start:static']).toContain('.next-static')
  })

  test('publishes the product navigation and bilingual content model', () => {
    expect(docsConfig.site).toMatchObject({
      title: 'Create Preset',
      url: 'https://preset.js.org',
    })
    expect(docsContentConfig.locales).toHaveProperty('en')
    expect(docsContentConfig.locales).toHaveProperty('zh')
    expect(docsContentConfig.sections).toMatchObject({
      guide: { layout: 'docs' },
    })
    expect(docsContentConfig.sections).not.toHaveProperty('presets')
  })

  test('publishes the preset JSON Schema', () => {
    const schemaPath = join(
      process.cwd(),
      '../schema/preset.schema.json',
    )
    const schema = JSON.parse(readFileSync(schemaPath, 'utf8')) as {
      $id?: string
    }
    expect(schema.$id).toBe(
      'https://preset.js.org/schema/preset.schema.json',
    )
  })

  test.each([
    'src/contents/en/guide/getting-started.mdx',
    'src/contents/en/guide/official-generators.md',
    'src/contents/en/guide/private-presets.md',
    'src/contents/en/guide/preset-configs.md',
    'src/contents/en/guide/migration.md',
    'src/contents/zh/guide/getting-started.mdx',
    'src/contents/zh/guide/official-generators.md',
    'src/contents/zh/guide/private-presets.md',
    'src/contents/zh/guide/preset-configs.md',
    'src/contents/zh/guide/migration.md',
  ])('ships %s', (path) => {
    expect(existsSync(join(process.cwd(), path))).toBe(true)
  })
})
