import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'

const globalsCss = readFileSync(
  join(process.cwd(), 'src/app/globals.css'),
  'utf8',
)

describe('docs globals css', () => {
  test('uses Tailwind CSS v4 imports and Blackwork theme tokens', () => {
    expect(globalsCss).toContain("@import 'tailwindcss';")
    expect(globalsCss).toContain("@import 'tw-animate-css';")
    expect(globalsCss).toContain("@import 'blackwork/tailwind.css';")
    expect(globalsCss).toContain("@import '@blackwork/docs/tailwind.css';")
    expect(globalsCss).toContain("@plugin '@tailwindcss/typography';")
    expect(globalsCss).toContain(
      '@custom-variant dark (&:where(.dark, .dark *));',
    )
    expect(globalsCss).not.toContain('node_modules')
  })

  test('excludes not-prose islands from article typography overrides', () => {
    expect(globalsCss).toContain(
      'article :where(h2, h3, h4):not(:where(.not-prose, .not-prose *))',
    )
    expect(globalsCss).toContain(
      'article :where(p, li):not(:where(.not-prose, .not-prose *))',
    )
  })

  test('lets inline code wrap on narrow screens so docs pages do not overflow horizontally', () => {
    expect(globalsCss).toContain(
      'article :where(code:not(pre code)):not(:where(.not-prose, .not-prose *))',
    )
    expect(globalsCss).toContain('@apply break-all whitespace-normal')
  })
})
