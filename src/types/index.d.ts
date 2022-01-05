import type { Chalk } from 'chalk'

export interface VariantItem {
  name: string
  description: string
  color: Chalk
  repo: string
}

export interface FrameworkItem {
  name: string
  color: Chalk
  variants: VariantItem[]
}
