'use client'

import {
  createSearchClient,
  type SearchClient,
  type SearchClientQueryOptions,
  type SearchClientResultItem,
} from '@blackwork/search/browser'
import * as React from 'react'

const MIN_QUERY_LENGTH = 2
const INDEX_UNAVAILABLE_MESSAGE =
  'Search index unavailable. Run the static build to generate Pagefind assets.'

const getSearchOptions = (
  locale: string | undefined,
): SearchClientQueryOptions | undefined =>
  locale
    ? {
        filters: {
          locale,
        },
      }
    : undefined

const toErrorMessage = (_error: unknown) => INDEX_UNAVAILABLE_MESSAGE

export interface UseDocsSearchOptions {
  locale?: string
  open: boolean
}

export interface UseDocsSearchResult {
  error?: string
  hasQuery: boolean
  items: SearchClientResultItem[]
  loading: boolean
  query: string
  setQuery: React.Dispatch<React.SetStateAction<string>>
}

export const useDocsSearch = ({
  locale,
  open,
}: UseDocsSearchOptions): UseDocsSearchResult => {
  const clientRef = React.useRef<SearchClient | null>(null)
  const [query, setQuery] = React.useState('')
  const [items, setItems] = React.useState<SearchClientResultItem[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | undefined>()
  const deferredQuery = React.useDeferredValue(query.trim())
  const hasQuery = deferredQuery.length >= MIN_QUERY_LENGTH

  React.useEffect(() => {
    return () => {
      const client = clientRef.current

      clientRef.current = null

      if (client) {
        void client.destroy()
      }
    }
  }, [])

  React.useEffect(() => {
    if (open) {
      return
    }

    setQuery('')
    setItems([])
    setLoading(false)
    setError(undefined)
  }, [open])

  React.useEffect(() => {
    if (!open) {
      return
    }

    if (!hasQuery) {
      setItems([])
      setLoading(false)
      setError(undefined)
      return
    }

    let cancelled = false

    const search = async () => {
      setLoading(true)
      setError(undefined)

      try {
        let client = clientRef.current

        if (!client) {
          client = createSearchClient()
          clientRef.current = client
        }

        const searchOptions = getSearchOptions(locale)

        await client.preload(deferredQuery, searchOptions)
        const result = await client.search(deferredQuery, searchOptions)

        if (cancelled) {
          return
        }

        React.startTransition(() => {
          setItems(result.items)
          setLoading(false)
        })
      } catch (error) {
        if (cancelled) {
          return
        }

        React.startTransition(() => {
          setItems([])
          setLoading(false)
          setError(toErrorMessage(error))
        })
      }
    }

    void search()

    return () => {
      cancelled = true
    }
  }, [deferredQuery, hasQuery, locale, open])

  return {
    error,
    hasQuery,
    items,
    loading,
    query,
    setQuery,
  }
}
