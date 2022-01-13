import type { Chalk } from 'chalk'

/**
 * The item type of root config file
 */
export interface OriginConfigItem {
  tech: string
  name: string
  desc: string
  repo: string
}

/**
 * The item type of config
 */
export interface ConfigItem extends OriginConfigItem {
  color: Chalk
}

/**
 * The type for CMD from user input
 */
export interface UserInputFromCMD {
  projectName: string
  packageName: string
  overwrite: boolean
  techStack: TechStackItem
  variant: string
}

/**
 * The item type of `variants` in tech stack
 */
export interface VariantItem {
  name: string
  desc: string
  color: Chalk
  repo: string
}

/**
 * The item type of tech stack in config
 */
export interface TechStackItem {
  name: string
  color: Chalk
  variants: VariantItem[]
}
