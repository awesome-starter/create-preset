import { createDocsSource } from '@blackwork/docs'
import { docsConfig } from '../../../../docs.config'
import { createSocialImage } from '@/site/social-image'
import { getSocialImagePath } from '@/site/social-metadata'

export const dynamic = 'force-static'
export const dynamicParams = false

function getEntries() {
  const source = createDocsSource({ config: docsConfig, rootDir: '.' })
  return source.getLocaleCodes().flatMap((locale) => source.getEntries(locale))
}

export function generateStaticParams() {
  return getEntries().map((entry) => ({
    slug: getSocialImagePath(entry)
      .slice('/og/'.length)
      .split('/')
      .map(decodeURIComponent),
  }))
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params
  const path = `/og/${slug.map(encodeURIComponent).join('/')}`
  const entry = getEntries().find((entry) => getSocialImagePath(entry) === path)

  if (!entry) return new Response('Not found', { status: 404 })

  return createSocialImage(
    entry,
    entry.description || docsConfig.site?.description || '',
  )
}
