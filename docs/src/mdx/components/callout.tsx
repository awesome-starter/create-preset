import { Alert, AlertDescription, AlertTitle } from 'blackwork/rsc'
import type React from 'react'

export interface CalloutProps extends React.PropsWithChildren {
  title?: string
}

export const Callout = ({
  title = 'Blackwork Note',
  children,
}: CalloutProps) => {
  return (
    <Alert className="not-prose my-6 border-border/80 bg-muted/30">
      <AlertTitle className="text-balance text-sm uppercase tracking-[0.08em]">
        {title}
      </AlertTitle>
      <AlertDescription className="text-pretty text-sm text-muted-foreground">
        {children}
      </AlertDescription>
    </Alert>
  )
}
