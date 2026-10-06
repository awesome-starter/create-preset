import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, test, vi } from 'vitest'
import { DocsSiteLink } from './docs-link'
import { getCurrentHeaderHref } from './navigation'

const { usePathname } = vi.hoisted(() => ({ usePathname: vi.fn() }))

vi.mock('next/navigation', () => ({ usePathname }))

describe('header navigation', () => {
  test.each([
    ['/zh/guide/preset-configs', '/guide/preset-configs'],
    ['/en/guide/preset-configs/', '/guide/preset-configs'],
    ['/guide/preset-configs', '/guide/preset-configs'],
    ['/zh/guide/private-presets', '/guide/getting-started'],
    ['/en/guide/official-generators/', '/guide/getting-started'],
    ['/zh/guide/preset-configs-other', '/guide/getting-started'],
    ['/zh', undefined],
  ])('selects one header destination for %s', (pathname, expected) => {
    expect(getCurrentHeaderHref(pathname)).toBe(expected)
  })

  test.each(['/zh/guide/preset-configs', '/en/guide/preset-configs/'])(
    'keeps only Preset configs current at %s',
    (pathname) => {
      usePathname.mockReturnValue(pathname)
      const locale = pathname.startsWith('/zh') ? '/zh' : '/en'
      const html = renderToStaticMarkup(
        React.createElement(
          'nav',
          null,
          React.createElement(DocsSiteLink, {
            href: `${locale}/guide/getting-started`,
            'aria-current': 'page',
            children: 'Guide',
          }),
          React.createElement(DocsSiteLink, {
            href: `${locale}/guide/preset-configs`,
            'aria-current': 'page',
            children: 'Preset configs',
          }),
        ),
      )

      expect(html.match(/aria-current="page"/g)).toHaveLength(1)
      const presetLink = html.match(/<a\b[^>]*>Preset configs<\/a>/)?.[0]
      expect(presetLink).toContain(`href="${locale}/guide/preset-configs"`)
      expect(presetLink).toContain('aria-current="page"')
    },
  )

  test('preserves sidebar and language current state', () => {
    usePathname.mockReturnValue('/zh/guide/preset-configs')
    const sidebarProps = { 'data-current-page': undefined }
    const localeProps = { 'data-current-locale': 'true' }
    const html = renderToStaticMarkup(
      React.createElement(
        'div',
        null,
        React.createElement(DocsSiteLink, {
          ...sidebarProps,
          href: '/zh/guide/getting-started',
          children: 'Quickstart',
        }),
        React.createElement(DocsSiteLink, {
          ...localeProps,
          href: '/zh/guide/preset-configs',
          'aria-current': 'page',
          children: '简体中文',
        }),
      ),
    )

    expect(html.match(/aria-current="page"/g)).toHaveLength(1)
    expect(html).toMatch(/aria-current="page"[^>]*>简体中文/)
  })

  test('opens the changelog in a separate browsing context', () => {
    usePathname.mockReturnValue('/zh')
    const html = renderToStaticMarkup(
      React.createElement(DocsSiteLink, {
        href: 'https://github.com/preset-cli/create-preset/releases',
        children: '更新日志',
      }),
    )

    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
  })
})
