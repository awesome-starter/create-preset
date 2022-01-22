import type { Chalk } from 'chalk'

/**
 * Subcommand type for core
 */
export interface SubcommandItem {
  cmd: string
  desc: string
}

/**
 * Current package info
 */
export interface PKGFromProgram {
  packageName: string
  currentVersion: string
  latestVersion: string
  needToUpgrade: boolean
}

/**
 * The package info from user agent
 */
export interface PKGFromUserAgent {
  name: string
  version: string
}

/**
 * The starter item type of root config file
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
  techStack: TechStackItem | undefined
  variant: string
}

/**
 * The item type of `variants` in tech stack
 */
export interface VariantItem extends Omit<ConfigItem, 'tech'> {}

/**
 * The type of color about the source of starters
 */
export interface ColorConfig {
  official: Chalk
  community: Chalk
  local: Chalk
}

/**
 * The type of tech stack from fetch
 */
export interface TechConfig {
  name: string
  color: string
}

/**
 * The item type of tech stack in config
 */
export interface TechStackItem extends Omit<TechConfig, 'color'> {
  color: Chalk
  variants: VariantItem[]
}
