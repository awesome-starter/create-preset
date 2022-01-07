import type { Chalk } from 'chalk'

export interface UserInputFromCMD {
  projectName: string
  packageName: string
  overwrite: boolean
  techStack: TechStackItem
  variant: string
}

export interface VariantItem {
  name: string
  description: string
  color: Chalk
  repo: string
}

export interface TechStackItem {
  name: string
  color: Chalk
  variants: VariantItem[]
}
