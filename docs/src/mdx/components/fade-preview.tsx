import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from 'blackwork/rsc'
import { cn } from '@/utils/class-name'

interface PreviewItem {
  label: string
  active?: boolean
  spotlight?: boolean
}

interface PreviewGroup {
  title: string
  items: PreviewItem[]
}

const previewGroups: PreviewGroup[] = [
  {
    title: 'Foundations',
    items: [
      { label: 'Installation' },
      { label: 'Theming' },
      { label: 'CLI', spotlight: true },
      { label: 'RTL' },
      { label: 'Skills', active: true, spotlight: true },
      { label: 'MCP Server' },
      { label: 'Registry' },
      { label: 'Forms' },
      { label: 'Changelog', spotlight: true },
    ],
  },
  {
    title: 'Components',
    items: [
      { label: 'Accordion' },
      { label: 'Alert' },
      { label: 'Alert Dialog' },
      { label: 'Aspect Ratio' },
      { label: 'Avatar' },
      { label: 'Badge' },
      { label: 'Breadcrumb' },
      { label: 'Button' },
      { label: 'Card' },
      { label: 'Carousel' },
      { label: 'Checkbox' },
      { label: 'Dialog' },
    ],
  },
]

export const DocsFadePreview = () => {
  return (
    <Card
      data-docs-region="fade-preview"
      className="not-prose my-8 overflow-hidden border-border/60"
    >
      <CardHeader className="space-y-2 border-b border-border/60">
        <CardTitle className="text-base">Scroll fade preview</CardTitle>
        <CardDescription>
          A mock long docs rail using the same fade treatment as the real docs
          sidebar.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4">
        <Card className="overflow-hidden border-border/60 shadow-none">
          <div className="border-b border-border/60 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Mock docs sidebar
            </p>
          </div>

          <div
            className="relative h-80 overflow-hidden"
            data-docs-region="docs-rail-preview"
          >
            <div
              data-docs-region="docs-rail-fade-top"
              className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-background via-background/85 to-transparent"
            />

            <div className="h-full overflow-hidden px-4 py-4">
              <nav
                className="flex flex-col gap-8"
                aria-label="Preview navigation"
              >
                {previewGroups.map((group) => (
                  <section key={group.title} className="flex flex-col gap-3">
                    <h3 className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      {group.title}
                    </h3>

                    <div className="flex flex-col gap-1 border-l border-border/60">
                      {group.items.map((item) => (
                        <div
                          key={item.label}
                          className={cn(
                            '-ml-px flex items-center gap-2 border-l py-1 pl-4 text-sm transition-colors',
                            item.active
                              ? 'rounded-r-md border-foreground bg-accent font-medium text-foreground'
                              : 'border-transparent text-muted-foreground',
                          )}
                        >
                          <span className="truncate">{item.label}</span>

                          {item.spotlight ? (
                            <span className="size-1.5 rounded-full bg-primary" />
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </nav>
            </div>

            <div
              data-docs-region="docs-rail-fade-bottom"
              className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-gradient-to-t from-background via-background/90 to-transparent"
            />
          </div>
        </Card>
      </CardContent>
    </Card>
  )
}
