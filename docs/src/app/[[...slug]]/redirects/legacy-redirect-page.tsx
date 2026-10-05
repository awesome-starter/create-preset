import { Button, LayoutMain } from 'blackwork'
import Link from 'next/link'

export interface LegacyRedirectPageProps {
  href: string
}

export const LegacyRedirectPage = ({ href }: LegacyRedirectPageProps) => {
  return (
    <LayoutMain className="items-center justify-center py-20">
      <meta httpEquiv="refresh" content={`0;url=${href}`} />
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 text-center">
        <h1 className="text-balance text-3xl font-semibold text-foreground">
          Redirecting to the canonical URL
        </h1>
        <p className="text-pretty text-muted-foreground">
          The default locale no longer appears in the public path. You will be
          sent to the canonical page automatically.
        </p>
        <Button asChild>
          <Link href={href}>Continue now</Link>
        </Button>
      </div>
    </LayoutMain>
  )
}
