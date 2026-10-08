import { createDocsSource, type DocEntry } from '@blackwork/docs'
import { describe, expect, test } from 'vitest'
import { docsConfig } from '../../docs.config'
import { createSocialMetadata, getSocialImagePath } from './social-metadata'

const source = createDocsSource({ config: docsConfig, rootDir: '.' })

function getEntry(locale: string, slugSegments: string[] = []) {
  const entry = source.getEntry(locale, slugSegments)
  expect(entry).not.toBeNull()
  return entry as DocEntry
}

describe('social previews', () => {
  test.each([
    ['en', 'en_US', 'Preset Configs', '/og/en/guide/preset-configs.png'],
    ['zh', 'zh_CN', 'Preset 配置', '/og/zh/guide/preset-configs.png'],
  ])('uses %s page content and canonical URLs', (locale, ogLocale, title, imagePath) => {
    const entry = getEntry(locale, ['guide', 'preset-configs'])
    const metadata = createSocialMetadata({ config: docsConfig, entry, source })

    expect(metadata.title).toBe(`${title} | Create Preset`)
    expect(metadata.description).toBe(entry.description)
    expect(metadata.openGraph).toMatchObject({
      title: metadata.title,
      description: entry.description,
      locale: ogLocale,
      url: metadata.alternates?.canonical,
      images: [{
        url: `https://preset.js.org${imagePath}`,
        width: 1200,
        height: 630,
        alt: metadata.title,
      }],
    })
    expect(metadata.twitter).toMatchObject({
      card: 'summary_large_image',
      title: metadata.title,
      description: entry.description,
      images: metadata.openGraph?.images,
    })
    expect(metadata.alternates?.languages).toHaveProperty('en-US')
    expect(metadata.alternates?.languages).toHaveProperty('zh-CN')
  })

  test('keeps English aliases noindex and shares the canonical preview', () => {
    const entry = getEntry('en', ['guide', 'preset-configs'])
    const metadata = createSocialMetadata({
      config: docsConfig,
      entry,
      source,
      pathname: '/en/guide/preset-configs',
    })

    expect(metadata.robots).toEqual({ index: false, follow: true })
    expect(metadata.openGraph?.url).toBe(`https://preset.js.org${entry.href}`)
    expect(metadata.openGraph?.images).toMatchObject([
      { url: 'https://preset.js.org/og/en/guide/preset-configs.png' },
    ])
  })

  test('gives both homepages their own image and uses the site description as fallback', () => {
    expect(getSocialImagePath(getEntry('en'))).toBe('/og/en/index.png')
    expect(getSocialImagePath(getEntry('zh'))).toBe('/og/zh/index.png')

    const metadata = createSocialMetadata({
      config: docsConfig,
      entry: { ...getEntry('en'), description: '' },
      source,
    })
    expect(metadata.openGraph?.description).toBe(docsConfig.site?.description)
    expect(metadata.twitter?.description).toBe(docsConfig.site?.description)
  })
})
