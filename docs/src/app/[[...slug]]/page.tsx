import {
  DocsPage,
  createDocsSource,
  resolveDocsRoute,
  generateMetadata as generateDocsMetadata,
  generateStaticParams as generateDocsStaticParams,
} from '@blackwork/docs'
import { notFound, redirect } from 'next/navigation'
import { docsConfig } from '../../../docs.config'
import { LegacyRedirectPage } from './redirects/legacy-redirect-page'
import { PresetHome } from '@/home/preset-home'

export const dynamicParams = false

const isStaticExport = process.env.NEXT_OUTPUT === 'export'
const rootDir = '.'

export async function generateStaticParams() {
  const params = await generateDocsStaticParams({
    config: docsConfig,
    rootDir,
  })

  return params.map((item) => ({
    slug: item.slug ?? [],
  }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>
}): Promise<import('next').Metadata> {
  return generateDocsMetadata({
    config: docsConfig,
    params,
    rootDir,
  })
}

export default async function DocsRoutePage({
  params,
}: {
  params: Promise<{ slug?: string[] }>
}) {
  const source = createDocsSource({ config: docsConfig, rootDir })
  const resolution = resolveDocsRoute({ source, params: await params })

  // Only canonical home routes use the product layout; aliases and docs keep
  // Blackwork's routing, redirects, and content rendering.
  if (resolution.kind === 'page' && resolution.slugSegments.length === 0) {
    return (
      <PresetHome
        config={docsConfig}
        entry={resolution.entry}
        source={source}
      />
    )
  }

  return DocsPage({
    config: docsConfig,
    onNotFound: () => notFound(),
    onRedirect: (href) =>
      isStaticExport ? <LegacyRedirectPage href={href} /> : redirect(href),
    params,
    rootDir,
  })
}
