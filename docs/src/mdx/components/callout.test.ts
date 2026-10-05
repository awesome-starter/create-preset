import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, test } from 'vitest'
import { Callout } from './callout'

describe('Callout', () => {
  test('renders through the shared alert component', () => {
    const html = renderToStaticMarkup(
      createElement(
        Callout,
        { title: 'Blackwork Note' },
        'Docs starter alert content.',
      ),
    )

    expect(html).toContain('role="alert"')
    expect(html).toContain('Blackwork Note')
    expect(html).toContain('Docs starter alert content.')
  })
})
