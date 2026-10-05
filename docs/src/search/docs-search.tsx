'use client'

import {
  Button,
  QuickSearchDialog,
  QuickSearchTrigger,
  useQuickSearchState,
} from 'blackwork'
import { Search } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'
import { cn } from '@/utils/class-name'
import { useDocsSearch } from './use-docs-search'
import type { DocsThemeHeaderActionsProps } from '@blackwork/docs/theme'

const SEARCH_COPY = {
  en: {
    ariaLabel: 'Search docs',
    emptyNoMatch: 'No matching pages found in this locale.',
    inputPlaceholder: 'Search docs...',
    loading: 'Searching docs...',
    minQuery: 'Type at least 2 characters to search the docs.',
    shortLabel: 'Search docs',
    triggerLabel: 'Search docs...',
  },
  zh: {
    ariaLabel: '搜索文档',
    emptyNoMatch: '当前语言下没有匹配结果。',
    inputPlaceholder: '搜索文档...',
    loading: '正在搜索文档...',
    minQuery: '至少输入 2 个字符后开始搜索。',
    shortLabel: '搜索文档',
    triggerLabel: '搜索文档...',
  },
} as const

type SearchLocaleCode = keyof typeof SEARCH_COPY

const resolveCopy = (locale: string | undefined) =>
  SEARCH_COPY[(locale ?? 'en').startsWith('zh') ? 'zh' : 'en']

const resolveSearchLocale = (
  localeLinks: DocsThemeHeaderActionsProps['localeLinks'],
) => localeLinks?.find((item) => item.current)?.locale

const getEmptyStateMessage = ({
  copy,
  error,
  hasQuery,
  loading,
}: Pick<ReturnType<typeof useDocsSearch>, 'error' | 'hasQuery' | 'loading'> & {
  copy: (typeof SEARCH_COPY)[SearchLocaleCode]
}) => {
  if (error) {
    return error
  }

  if (loading) {
    return copy.loading
  }

  if (!hasQuery) {
    return copy.minQuery
  }

  return copy.emptyNoMatch
}

const ResultExcerpt: React.FC<{ excerpt?: string }> = ({ excerpt }) => {
  if (!excerpt) {
    return null
  }

  return (
    <p
      className="line-clamp-2 text-pretty text-sm text-muted-foreground"
      dangerouslySetInnerHTML={{ __html: excerpt }}
    />
  )
}

export const DocsHeaderSearchAction: React.FC<DocsThemeHeaderActionsProps> = ({
  localeLinks,
}) => {
  const { open, setOpen } = useQuickSearchState()
  const locale = resolveSearchLocale(localeLinks)
  const copy = resolveCopy(locale)
  const { error, hasQuery, items, loading, query, setQuery } = useDocsSearch({
    locale,
    open,
  })

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={copy.ariaLabel}
          className="md:hidden"
          onClick={() => setOpen(true)}
        >
          <Search className="size-4" aria-hidden="true" />
        </Button>

        <QuickSearchTrigger
          className="hidden md:flex md:w-48 lg:w-64"
          label={copy.triggerLabel}
          shortLabel={copy.shortLabel}
          onClick={() => setOpen(true)}
        />
      </div>

      <QuickSearchDialog
        open={open}
        onOpenChange={setOpen}
        ariaLabel={copy.ariaLabel}
        contentProps={{
          className:
            'max-w-2xl overflow-hidden border border-border/60 bg-background/95 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-background/90 [&>button]:hidden',
        }}
      >
        <div className="border-b border-border/60 px-4 py-3">
          <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-background/70 px-3 shadow-sm">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              aria-label={copy.ariaLabel}
              placeholder={copy.inputPlaceholder}
              className={cn(
                'h-10 w-full bg-transparent text-sm text-foreground outline-none',
                'placeholder:text-muted-foreground',
              )}
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
            />
            <kbd className="hidden rounded border border-border/70 bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground md:inline-flex">
              ESC
            </kbd>
          </div>
        </div>

        <div
          aria-busy={loading ? 'true' : undefined}
          className="max-h-[min(65vh,520px)] overflow-y-auto p-3"
        >
          {items.length === 0 ? (
            <div className="flex min-h-36 items-center justify-center px-6 text-center text-sm text-muted-foreground">
              {getEmptyStateMessage({
                copy,
                error,
                hasQuery,
                loading,
              })}
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.url}
                    className={cn(
                      'block rounded-xl border border-border/70 bg-card/70 px-4 py-3 transition-colors',
                      'hover:border-border hover:bg-accent/50',
                      'focus-visible:border-ring focus-visible:bg-accent/60 focus-visible:outline-none',
                    )}
                    onClick={() => setOpen(false)}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-foreground">
                          {item.title ?? item.url}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {item.url}
                        </span>
                      </div>

                      <ResultExcerpt excerpt={item.excerpt} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </QuickSearchDialog>
    </>
  )
}
