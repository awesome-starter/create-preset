import type { Chalk } from 'chalk'

export interface UserInputFromCMD {
  projectName: string
  overwrite: boolean
  framework: FrameworkItem[]
  variant: string
}

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
