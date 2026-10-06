import {
  buildHeaderNavigation,
  buildLocaleLinks,
  type DocEntry,
  type DocsSource,
  type NormalizedDocsConfig,
} from '@blackwork/docs'
import {
  createHomeData,
  DefaultDocsHeader,
} from '@blackwork/docs/theme'
import { Button } from 'blackwork/rsc'
import Link from 'next/link'
import { DocsHeaderSearchAction } from '@/search/docs-search'
import { PackageManagerCommands } from '@/mdx/components/package-manager-commands'
import { PresetFooter } from '@/site/footer'
import { cn } from '@/utils/class-name'
import { homeCopy } from './copy'
import styles from './preset-home.module.css'

const githubUrl = 'https://github.com/preset-cli/create-preset'

export function PresetHome({
  config,
  entry,
  source,
}: {
  config: NormalizedDocsConfig
  entry: DocEntry
  source: DocsSource
}) {
  const copy = homeCopy[entry.locale === 'zh' ? 'zh' : 'en']
  const home = createHomeData({ config, locale: entry.locale, source })
  const navigation = buildHeaderNavigation({
    config,
    currentHref: entry.href,
    locale: entry.locale,
    source,
  })
  const localeLinks = buildLocaleLinks({ config, entry, source })
  const badge = typeof home.badge === 'object' ? home.badge : undefined
  const startLink = (large = false) => (
    <Button
      asChild
      variant={config.theme.appearance === 'glass' ? 'glass-primary' : 'default'}
      size="lg"
      className={cn(
        'rounded-full',
        large ? 'h-12 w-60 text-xl' : 'h-10 w-30',
      )}
    >
      <Link href={home.primaryAction.href}>{home.primaryAction.label}</Link>
    </Button>
  )

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <DefaultDocsHeader
        appearance={config.theme.appearance}
        homeHref={home.homeHref}
        siteTitle={home.title}
        siteDescription={home.description}
        navigation={navigation}
        localeLinks={localeLinks}
        labels={copy.labels}
        LinkComponent={Link}
        socialLinks={[
          {
            type: 'github',
            link: githubUrl,
            label: 'GitHub',
            ariaLabel: copy.sourceCode,
          },
        ]}
        headerActions={
          <DocsHeaderSearchAction
            homeHref={home.homeHref}
            siteTitle={home.title}
            navigation={navigation}
            localeLinks={localeLinks}
          />
        }
      />
      <main
        className="w-full flex-1"
        data-docs-region="home-shell"
        data-pagefind-body=""
      >
        <span hidden data-pagefind-filter={`locale:${entry.locale}`} />
        <section
          className={cn(
            styles.hero,
            'flex min-h-130 flex-col items-center justify-center px-6 py-12 text-center md:min-h-180',
          )}
          aria-labelledby="home-title"
          data-docs-region="home-hero"
        >
          <img
            src="/logo-compact.svg"
            alt={copy.logo}
            width={858}
            height={623}
            className="mb-4 h-auto w-80 max-w-[60vw]"
            fetchPriority="high"
          />
          <h1
            id="home-title"
            className={cn(
              styles.title,
              'text-balance text-4xl leading-tight font-bold md:text-8xl',
            )}
          >
            {home.title}
          </h1>
          <p className="mt-4 max-w-4xl text-pretty text-xl leading-relaxed text-gray-600 md:text-2xl">
            {home.description}
          </p>
          <div className="mt-8 flex min-h-5 flex-wrap items-center justify-center gap-2">
            {badge && (
              <a
                href={badge.href}
                target="_blank"
                rel="noreferrer"
                className={styles.badgeLink}
              >
                <img
                  src={badge.src}
                  alt={badge.alt}
                  width={100}
                  height={20}
                  className="h-5 w-auto"
                />
              </a>
            )}
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className={styles.badgeLink}
            >
              <img
                src="https://img.shields.io/github/stars/preset-cli/create-preset?style=social"
                alt={copy.stars}
                width={100}
                height={20}
                className="h-5 w-auto"
              />
            </a>
          </div>
          <div className="mt-8">{startLink()}</div>
        </section>

        <div className="mx-auto w-11/12 max-w-5xl pb-12 md:pb-16">
          <section
            className="my-4 md:my-12"
            aria-label={copy.featuresLabel}
            data-docs-region="home-highlights"
          >
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {copy.features.map((feature) => (
                <li
                  key={feature.title}
                  className="rounded-xl bg-neutral-50 p-4 dark:bg-neutral-800"
                >
                  <div className="mb-2 flex items-center gap-4">
                    <span
                      aria-hidden="true"
                      className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-xl dark:bg-neutral-900"
                    >
                      {feature.icon}
                    </span>
                    <h2 className="text-balance text-lg font-bold">
                      {feature.title}
                    </h2>
                  </div>
                  <p className="text-pretty text-sm leading-6 text-muted-foreground">
                    {feature.description}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="usage-title" className="space-y-4 pt-4">
            <h2
              id="usage-title"
              className="border-t border-border pt-6 text-balance text-2xl font-semibold"
            >
              {copy.usageTitle}
            </h2>
            <p className="text-pretty leading-7 text-muted-foreground">
              {copy.usageDescription}
            </p>
            <PackageManagerCommands locale={entry.locale === 'zh' ? 'zh' : 'en'} />
          </section>

          <section aria-labelledby="preview-title" className="mt-12 space-y-4">
            <h2
              id="preview-title"
              className="border-t border-border pt-6 text-balance text-2xl font-semibold"
            >
              {copy.previewTitle}
            </h2>
            <p className="text-pretty leading-7 text-muted-foreground">
              {copy.previewDescription}
            </p>
            <figure>
              <div className="overflow-hidden rounded-xl border border-neutral-700 bg-neutral-900 text-neutral-100">
                <div
                  className="flex items-center gap-2 border-b border-neutral-700 px-4 py-3"
                  aria-hidden="true"
                >
                  <span className="size-3 rounded-full bg-neutral-500" />
                  <span className="size-3 rounded-full bg-neutral-500" />
                  <span className="size-3 rounded-full bg-neutral-500" />
                  <span className="ml-2 font-mono text-xs text-neutral-400">
                    create-preset
                  </span>
                </div>
                <pre
                  className="overflow-x-auto p-6 font-mono text-sm leading-7 sm:p-8 sm:text-base"
                  tabIndex={0}
                  aria-label={copy.previewTitle}
                >
                  <code>
                    {'$ pnpm create preset\n\n'}
                    <span className="text-emerald-400">create-preset</span>
                    {'\n'}
                    <span className="text-neutral-400">
                      {copy.terminalDescription}
                    </span>
                    {'\n\n'}
                    {copy.projectName}
                    {': my-preset-app\n'}
                    {copy.selectStack}
                    {': Vue\n'}
                    {copy.selectPreset}
                    {':\n'}
                    <span className="text-emerald-400">
                      {'❯ '}
                      {copy.vueStarter}
                      {' ↗'}
                    </span>
                    {'\n  Nuxt ↗'}
                  </code>
                </pre>
              </div>
              <figcaption className="mt-3 text-pretty text-sm leading-6 text-muted-foreground">
                {copy.previewCaption}
              </figcaption>
            </figure>
          </section>
          <div className="mt-8 flex justify-center">{startLink(true)}</div>
        </div>
      </main>
      <PresetFooter />
    </div>
  )
}
