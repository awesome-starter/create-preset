'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from 'blackwork'

const commands = {
  create: [
    { id: 'pnpm', label: 'pnpm', command: 'pnpm create preset' },
    { id: 'npm', label: 'npm', command: 'npm create preset' },
    { id: 'yarn', label: 'Yarn', command: 'yarn create preset' },
    { id: 'bun', label: 'Bun', command: 'bun create preset' },
  ],
  install: [
    { id: 'pnpm', label: 'pnpm', command: 'pnpm add -g create-preset' },
    { id: 'npm', label: 'npm', command: 'npm install -g create-preset' },
    { id: 'yarn', label: 'Yarn Classic', command: 'yarn global add create-preset' },
    { id: 'bun', label: 'Bun', command: 'bun add -g create-preset' },
  ],
} as const

export function PackageManagerCommands({
  mode = 'create',
  locale = 'en',
}: {
  mode?: keyof typeof commands
  locale?: 'en' | 'zh'
}) {
  return (
    <Tabs defaultValue="pnpm" className="not-prose my-4 min-w-0">
      <TabsList aria-label={locale === 'zh' ? '包管理器' : 'Package manager'}>
        {commands[mode].map(({ id, label }) => (
          <TabsTrigger key={id} value={id}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      {commands[mode].map(({ id, command }) => (
        <TabsContent key={id} value={id}>
          <pre className="overflow-x-auto rounded-xl bg-muted px-6 py-5 text-sm leading-7">
            <code>{command}</code>
          </pre>
        </TabsContent>
      ))}
    </Tabs>
  )
}
