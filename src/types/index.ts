import type { Chalk } from 'chalk'

/**
 * The `.presetrc` file content type
 */
export interface RuntimeConfigFileContent {
  proxy?: string
  localTech?: string
  localPreset?: string
}

export type LocalConfigType = 'localTech' | 'localPreset'

/**
 * Subcommand type for core
 */
export interface SubcommandItem {
  cmd: string
  desc: string
}

export interface PackageUpgradeInfo {
  packageName: string
  currentVersion: string
  latestVersion: string
  needToUpgrade: boolean
}

/**
 * The starter item type of root config file
 */
export interface OriginConfigItem {
  tech: string
  name: string
  desc: string
  repo: string
  mirror: string
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
export interface UserInputInfoFromCommandLine {
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

export interface GetDownloadUrlOptions {
  /**
   * The selected template name from CMD
   */
  template: string

  /**
   * The `variants` in `techStack` from config
   */
  variants: VariantItem[] | ConfigItem[]
}

export interface DownloadOptions {
  /**
   * The repo url to download
   */
  repo: string

  /**
   * The project folder name
   */
  folder: string

  /**
   * If true, use `git clone` to download repo
   */
  clone?: boolean
}
