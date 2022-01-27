import fs from 'fs'
import chalk from 'chalk'
import ora from 'ora'
import fetch from 'node-fetch'
import { get as getLocalConfigFilePath } from './local'
import { unique } from './utils'
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
 * Read tech stack config file from local
 * @returns Tech list
 */
export function readTechConfig(): TechConfig[] {
  try {
    const filePath: string = getLocalConfigFilePath(true)
    const data: string = fs.readFileSync(filePath, 'utf-8')
    const config: TechConfig[] = JSON.parse(data)
    if (!Array.isArray(config)) {
      return []
    }
    return config
  } catch (e) {
    return []
  }
}

/**
 * Get the list of supported tech stacks
 * @returns Tech list
 */
export async function fetchTechConfig(): Promise<TechConfig[]> {
  try {
    const res = await fetch(`https://preset.js.org/config/tech.json`)
    const config: TechConfig[] = await res.json()
    if (!Array.isArray(config)) {
      return []
    }
    return config
  } catch (e) {
    return []
  }
}

/**
 * Unique tech stacks
 * @returns A unique list
 */
export async function uniqueTechConfig(): Promise<TechConfig[]> {
  const uniqueList = unique({
    target: 'name',
    list: [...(await fetchTechConfig()), ...readTechConfig()],
  })
  return uniqueList as TechConfig[]
}

/**
 * Get the basic tech stack config, without variants
 * @returns The tech stack config without variants
 */
export async function getTechStacks(): Promise<TechStackItem[]> {
  const techConfig: TechConfig[] = await uniqueTechConfig()
  const techStack: TechStackItem[] = techConfig.map((tech) => {
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

  const techConfig: TechConfig[] = await uniqueTechConfig()
  const techNames: string[] = techConfig.map((t) => t.name)
  const config: ConfigItem[] = originConfig
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
 * Read config file from local
 * @param fileName - The config file name
 * @returns The config array from root config file
 */
export async function readConfigFile(fileName: string): Promise<ConfigItem[]> {
  try {
    const filePath: string = getLocalConfigFilePath()
    const data: string = fs.readFileSync(filePath, 'utf-8')
    const originConfig: OriginConfigItem[] = JSON.parse(data)
    const config: ConfigItem[] = await handleOriginConfig(
      fileName,
      originConfig
    )
    return config
  } catch (e) {
    return []
  }
}

/**
 * Fetch config file from remote
 * @param fileName - The config file name
 * @returns The config array from root config file
 */
export async function fetchConfigFile(fileName: string): Promise<ConfigItem[]> {
  try {
    const res = await fetch(`https://preset.js.org/config/${fileName}.json`)
    const originConfig: OriginConfigItem[] = await res.json()
    const config: ConfigItem[] = await handleOriginConfig(
      fileName,
      originConfig
    )
    return config
  } catch (e) {
    return []
  }
}

/**
 * Unique tech stacks
 * @returns A unique list
 */
export async function uniqueConfig(): Promise<ConfigItem[]> {
  const uniqueListByName = unique({
    target: 'name',
    list: [
      ...(await readConfigFile('local')),
      ...(await fetchConfigFile('official')),
      ...(await fetchConfigFile('community')),
    ],
  })
  const uniqueList = unique({
    target: 'repo',
    list: uniqueListByName,
  })
  return uniqueList as ConfigItem[]
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

  // Get tech stack data
  const techStacks: TechStackItem[] = await getTechStacks()

  // Meger all template data
  const templateList: ConfigItem[] = await uniqueConfig()

  // Fill tech stack variants
  templateList.forEach((template) => {
    const { tech, name, desc, repo, color } = template
    const target = techStacks.find((t) => t.name === tech)
    if (!target) return
    target.variants.push({
      name,
      desc: desc.length > 80 ? desc.slice(0, 80) + '…' : desc,
      repo,
      color,
    })
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
