import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, test } from 'vitest'
import { DocsFadePreview } from './fade-preview'

describe('DocsFadePreview', () => {
  test('renders a mock long-sidebar preview with fade rails', () => {
    const html = renderToStaticMarkup(createElement(DocsFadePreview))

    expect(html).toContain('data-docs-region="fade-preview"')
    expect(html).toContain('data-docs-region="docs-rail-fade-top"')
    expect(html).toContain('data-docs-region="docs-rail-fade-bottom"')
    expect(html).toMatch(
      /class="(?=[^"]*\brounded-lg\b)(?=[^"]*\bborder\b)(?=[^"]*\bbg-card\b)(?=[^"]*\btext-card-foreground\b)(?=[^"]*\bshadow-sm\b)[^"]*"/u,
    )
    expect(html).toContain('Scroll fade preview')
    expect(html).toContain('Skills')
  })
})
