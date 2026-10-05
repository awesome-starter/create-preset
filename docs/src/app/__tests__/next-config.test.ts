import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'

describe('docs starter next config', () => {
  test('keeps the Next config free of manual content wiring', () => {
    const nextConfigSource = readFileSync(
      join(process.cwd(), 'next.config.ts'),
      'utf8',
    )

    expect(nextConfigSource).not.toContain("from './content.config'")
  })

  test('wraps the app config with the shared docs Next integration', async () => {
    const nextConfigModule = (await import('../../../next.config')) as {
      default: Record<string, unknown>
    }

    expect(nextConfigModule.default.turbopack).toMatchObject({
      root: process.cwd(),
      resolveAlias: {
        'private-blackwork-docs-root/*': './*',
      },
    })
  })
})
