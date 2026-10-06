'use client'

import type { DocsThemeLinkProps } from '@blackwork/docs/theme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/utils/class-name'
import {
  getCurrentHeaderHref,
  headerNavigation,
  normalizeNavigationPath,
} from './navigation'

export function DocsSiteLink({ href, className, ...props }: DocsThemeLinkProps) {
  const pathname = usePathname()

  if (/^https?:\/\//.test(href)) {
    return (
      <a
        {...props}
        href={href}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
      />
    )
  }

  const path = normalizeNavigationPath(href)
  // Blackwork marks every link in a shared section as current. Limit this
  // correction to header items; sidebar and locale links own their state.
  const isHeaderItem =
    'aria-current' in props &&
    !('data-current-page' in props) &&
    !('data-current-locale' in props) &&
    headerNavigation.some((item) => item.href === path)
  const current = isHeaderItem && getCurrentHeaderHref(pathname) === path

  return (
    <Link
      {...props}
      href={href}
      scroll={false}
      aria-current={
        isHeaderItem ? (current ? 'page' : undefined) : props['aria-current']
      }
      className={cn(
        className,
        isHeaderItem &&
          (current
            ? 'font-medium text-foreground'
            : 'font-normal text-muted-foreground hover:text-foreground'),
      )}
    />
  )
}
