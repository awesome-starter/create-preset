import {
  createDocMetadata,
  type CreateDocMetadataOptions,
  type DocEntry,
} from '@blackwork/docs'
import type { Metadata } from 'next'

export const socialImageSize = { width: 1200, height: 630 }

export function getSocialImagePath(entry: DocEntry) {
  const path = entry.slugSegments.length ? entry.slugSegments : ['index']
  return `/og/${[entry.locale, ...path].map(encodeURIComponent).join('/')}.png`
}

export function createSocialMetadata(options: CreateDocMetadataOptions): Metadata {
  const metadata = createDocMetadata(options)
  const { entry, config } = options
  const image = {
    url: new URL(getSocialImagePath(entry), metadata.alternates.canonical).href,
    ...socialImageSize,
    alt: metadata.title,
  }

  return {
    ...metadata,
    openGraph: {
      type: 'website',
      siteName: config?.site?.title,
      title: metadata.title,
      description: metadata.description,
      url: metadata.alternates.canonical,
      locale: config?.content?.locales?.[entry.locale]?.lang?.replace('-', '_'),
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title: metadata.title,
      description: metadata.description,
      images: [image],
    },
  }
}
