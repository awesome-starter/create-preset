import { LayoutFooter } from 'blackwork/rsc'

export function PresetFooter() {
  return (
    <LayoutFooter
      data-docs-region="footer"
      className="h-auto min-h-16 flex-col gap-1 border-t border-border/60 bg-background px-6 py-6 text-center text-sm text-muted-foreground"
    >
      <p>Released under the MIT License.</p>
      <p>
        Copyright © 2022–PRESENT{' '}
        <a
          href="https://github.com/chengpeiquan"
          target="_blank"
          rel="noreferrer"
          className="underline-offset-4 hover:underline"
        >
          @chengpeiquan
        </a>
      </p>
    </LayoutFooter>
  )
}
