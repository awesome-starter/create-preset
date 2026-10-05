import { DocsRootLayout } from '@blackwork/docs'
import { docsConfig } from '../../docs.config'
import './globals.css'

export default function RootLayout({
  children,
  params,
}: React.PropsWithChildren<{
  params: Promise<{ slug?: string[] }>
}>) {
  return (
    <DocsRootLayout config={docsConfig} params={params}>
      {children}
    </DocsRootLayout>
  )
}
