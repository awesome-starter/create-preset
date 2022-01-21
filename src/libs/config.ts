import fs from 'fs'
import { resolve } from 'path'
import chalk from 'chalk'
import ora from 'ora'
import fetch from 'node-fetch'
import { get as getLocalConfigFilePath } from './local'
import {
  ColorConfig,
  TechConfig,
  TechStackItem,
  OriginConfigItem,
  ConfigItem,
} from '@/types'

/**
 * Template name's color
 */
const colorConfig: ColorConfig = {
  official: chalk.yellow,
  community: chalk.white,
  local: chalk.cyan,
}

/**
 * Get the list of supported tech stacks
 * @returns Tech list
 */
export async function fetchTechConfig(): Promise<TechConfig[]> {
  try {
    const res = await fetch(`https://preset.js.org/config/tech.json`)
    const config = await res.json()
    if (!Array.isArray(config)) {
      return []
    }
    return config
  } catch (e) {
    return []
  }
}

/**
 * Get the basic tech stack config, without variants
 * @returns The tech stack config without variants
 */
export async function getTechStacks(): Promise<TechStackItem[]> {
  const techConfig = await fetchTechConfig()
  const techStack = techConfig.map((tech) => {
    return {
      name: tech.name,
      color: chalk.hex(tech.color),
      variants: [],
    }
  })

  return techStack
}

/**
 * Handle origin config item to be config item
 *
 * @param fileName - The config file name
 * @param originConfig - The origin config
 * @returns The config array from root config file
 */
export async function handleOriginConfig(
  fileName: string,
  originConfig: OriginConfigItem[]
): Promise<ConfigItem[]> {
  if (!Array.isArray(originConfig)) {
    return []
  }

  const techConfig = await fetchTechConfig()
  const techNames = techConfig.map((t) => t.name)
  const config = originConfig
    .filter((item) => techNames.includes(item.tech))
    .map((item) => {
      return {
        ...item,
        color: colorConfig[fileName],
      }
    })

  return config
}

/**
 * Read config file
 *
 * @param fileName - The config file name
 * @returns The config array from root config file
 */
export async function readConfigFile(fileName: string): Promise<ConfigItem[]> {
  try {
    const filePath =
      fileName === 'local'
        ? getLocalConfigFilePath()
        : resolve(__dirname, `../../config/${fileName}.json`)
    const data = fs.readFileSync(filePath, 'utf-8')
    const originConfig = JSON.parse(data)
    const config = await handleOriginConfig(fileName, originConfig)
    return config
  } catch (e) {
    return []
  }
}

/**
 * Fetch config file from CDN
 * @param fileName - The config file name
 * @returns The config array from root config file
 */
export async function fetchConfigFile(fileName: string): Promise<ConfigItem[]> {
  let config: ConfigItem[] = []

  try {
    const res = await fetch(`https://preset.js.org/config/${fileName}.json`)
    const originConfig = await res.json()
    config = await handleOriginConfig(
      fileName,
      originConfig as OriginConfigItem[]
    )
  } catch (e) {
    config = []
  }

  return config
}

/**
 * Get config
 * @returns Config
 */
export async function getConfig(): Promise<{
  techStacks: TechStackItem[]
  templates: string[]
}> {
  console.log()
  const spinner = ora('Fetching the latest config…').start()

  // Get template data from root config files
  const official = await fetchConfigFile('official')
  const community = await fetchConfigFile('community')
  const local = await readConfigFile('local')

  // Fill tech stack variants
  const techStacks = await getTechStacks()
  const templateList = [...local, ...official, ...community]
  templateList.forEach((template) => {
    const { tech, name, desc, repo, color } = template
    const target = techStacks.find((t) => t.name === tech)
    if (!target) return
    target.variants.push({ name, desc, repo, color })
  })

  // Get template names from tech stack list
  const templates = techStacks
    .map((f) => (f.variants && f.variants.map((v) => v.name)) || [f.name])
    .reduce((a, b) => a.concat(b), [])

  spinner.succeed(chalk.green('Get the latest config successfully.'))
  console.log()

  return {
    techStacks,
    templates,
  }
}
