import { Badge, Button, Card, CardContent, CardHeader } from 'blackwork/rsc'

const copy = {
  en: {
    description:
      'A documentation starter with Markdown and MDX, bilingual content, theme controls, and static search. Maintained by Blackwork and created through a public preset.',
    screenshot:
      'The MDX Playground in a project generated from the Blackwork Docs Starter preset.',
    caption: 'Actual generated starter · MDX Playground',
    source: 'View preset',
    website: 'Blackwork website',
    category: 'Documentation',
    create: 'Create this project',
    createHref: '#create-this-project',
  },
  zh: {
    description:
      '支持 Markdown 和 MDX、中英文内容、主题切换与静态搜索的文档站模板。由 Blackwork 维护，通过公开 Preset 创建。',
    screenshot:
      '通过 Blackwork Docs Starter Preset 实际生成的项目中的 MDX 示例页面。',
    caption: '实际生成的模板 · MDX 示例页面',
    source: '查看 Preset',
    website: 'Blackwork 官网',
    category: '文档站',
    create: '创建这个项目',
    createHref: '#创建这个项目',
  },
} as const

export function ShowcaseProject({ locale = 'en' }: { locale?: 'en' | 'zh' }) {
  const text = copy[locale]

  return (
    <section
      className="not-prose my-8"
      aria-labelledby="blackwork-starter-title"
    >
      <Card className="gap-0 overflow-hidden p-0">
        <figure className="m-0 border-b border-border">
          <img
            src="/showcase/blackwork-docs-starter-light.jpg"
            alt={text.screenshot}
            width={1280}
            height={720}
            className="block h-auto w-full dark:hidden"
          />
          <img
            src="/showcase/blackwork-docs-starter-dark.jpg"
            alt={text.screenshot}
            width={1280}
            height={720}
            className="hidden h-auto w-full dark:block"
          />
          <figcaption className="px-6 py-3 text-xs text-muted-foreground">
            {text.caption}
          </figcaption>
        </figure>
        <CardHeader className="pt-6">
          <h2 id="blackwork-starter-title" className="text-xl font-semibold">
            Blackwork Docs Starter
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {text.description}
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 pb-6">
          <div className="flex flex-wrap gap-2">
            {[text.category, 'Next.js', 'Blackwork', 'MDX'].map((label) => (
              <Badge key={label} variant="secondary">
                {label}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="glass-primary">
              <a href={text.createHref}>{text.create}</a>
            </Button>
            <Button asChild variant="outline">
              <a
                href="https://github.com/chengpeiquan/blackwork/blob/main/presets/docs-starter.json"
                target="_blank"
                rel="noopener noreferrer"
              >
                {text.source}
              </a>
            </Button>
            <Button asChild variant="ghost">
              <a
                href="https://ui.chengpeiquan.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                {text.website}
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
