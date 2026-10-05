'use client'

import { ScrollArea } from 'blackwork'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/utils/class-name'
import { getDocsRailFadeState } from './rail-scroll-state'

export interface DocsRailScrollProps {
  children: ReactNode
  className?: string
  scrollClassName?: string
  topFadeClassName?: string
  bottomFadeClassName?: string
}

const initialFadeState = {
  showTop: false,
  showBottom: false,
}

export const DocsRailScroll = ({
  children,
  className,
  scrollClassName,
  topFadeClassName,
  bottomFadeClassName,
}: DocsRailScrollProps) => {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [fadeState, setFadeState] = useState(initialFadeState)

  useEffect(() => {
    const root = rootRef.current

    if (!root) return

    const viewport = root.querySelector<HTMLElement>(
      '[data-radix-scroll-area-viewport]',
    )

    if (!viewport) return

    const updateFadeState = () => {
      const nextState = getDocsRailFadeState({
        scrollTop: viewport.scrollTop,
        clientHeight: viewport.clientHeight,
        scrollHeight: viewport.scrollHeight,
      })

      setFadeState((currentState) => {
        if (
          currentState.showTop === nextState.showTop &&
          currentState.showBottom === nextState.showBottom
        ) {
          return currentState
        }

        return nextState
      })
    }

    updateFadeState()

    viewport.addEventListener('scroll', updateFadeState, { passive: true })

    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => {
            updateFadeState()
          })

    resizeObserver?.observe(viewport)

    const content = viewport.firstElementChild

    if (content instanceof HTMLElement) {
      resizeObserver?.observe(content)
    }

    return () => {
      viewport.removeEventListener('scroll', updateFadeState)
      resizeObserver?.disconnect()
    }
  }, [])

  return (
    <div ref={rootRef} className={cn('relative h-full', className)}>
      <div
        data-docs-region="docs-rail-fade-top"
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-background via-background/85 to-transparent transition-opacity',
          fadeState.showTop ? 'opacity-100' : 'opacity-0',
          topFadeClassName,
        )}
      />

      <ScrollArea className={cn('h-full', scrollClassName)}>
        {children}
      </ScrollArea>

      <div
        data-docs-region="docs-rail-fade-bottom"
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-gradient-to-t from-background via-background/90 to-transparent transition-opacity',
          fadeState.showBottom ? 'opacity-100' : 'opacity-0',
          bottomFadeClassName,
        )}
      />
    </div>
  )
}
