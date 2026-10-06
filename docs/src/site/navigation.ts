import { docsContentConfig } from '../../content.config'

export const headerNavigation = [
  {
    href: '/guide/getting-started',
    label: { en: 'Guide', zh: '指南' },
  },
  {
    href: '/guide/preset-configs',
    label: { en: 'Preset configs', zh: 'Preset 配置' },
  },
  {
    href: '/showcase',
    label: { en: 'Showcase', zh: '案例展示' },
  },
  {
    href: 'https://github.com/preset-cli/create-preset/releases',
    label: { en: 'Changelog', zh: '更新日志' },
  },
]

export const normalizeNavigationPath = (href: string) => {
  const segments = href.split(/[?#]/, 1)[0].split('/').filter(Boolean)

  if (segments[0] in docsContentConfig.locales) {
    segments.shift()
  }

  return `/${segments.join('/')}`
}

export const getCurrentHeaderHref = (pathname: string) => {
  const path = normalizeNavigationPath(pathname)
  const matchingItem = headerNavigation
    .filter(({ href }) => href.startsWith('/'))
    .sort((a, b) => b.href.length - a.href.length)
    .find(({ href }) => path === href || path.startsWith(`${href}/`))

  return (
    matchingItem?.href ??
    (path.startsWith('/guide/') || path === '/guide'
      ? '/guide/getting-started'
      : undefined)
  )
}
