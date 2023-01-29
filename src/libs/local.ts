import chalk from 'chalk'
import fs from 'fs'
import os from 'os'
import { resolve } from 'path'
import argv from './argv'
import type { PresetRCFileContent } from '@/types'

// Get user's config path of program
const homedir = os.homedir()
const rcFile = resolve(homedir, '.presetrc')

// If `true`, handle the tech config
const isTech = Boolean(argv.tech) || Boolean(argv.t)
const key: string = isTech ? 'localTech' : 'localPreset'

/**
 * Get `.presetrc` file content
 * @returns JSON of `.presetrc`
 */
export function readRuntimeConfigFile(): PresetRCFileContent {
  let rcConfig: PresetRCFileContent = {}

  try {
    const data = fs.readFileSync(rcFile, 'utf-8')
    rcConfig = JSON.parse(data)
  } catch (e) {
    // console.log(e)
  }

  const keys: string[] = ['proxy', 'localTech', 'localPreset']
  keys.forEach((k) => {
    if (!Object.prototype.hasOwnProperty.call(rcConfig, k)) {
      rcConfig[k] = ''
    }
  })

  return rcConfig
}

/**
 * Save `.presetrc` file content
 * @param key - Key of `.presetrc` JSON
 * @param value - Value of the key in `.presetrc` JSON
 * @returns isSuccess
 *  true: success
 *  false: fail
 */
export function saveRuntimeConfigFile(key: string, value: string): boolean {
  try {
    const rcConfig: PresetRCFileContent = readRuntimeConfigFile()
    rcConfig[key] = value
    fs.writeFileSync(rcFile, JSON.stringify(rcConfig, null, 2))
    return true
  } catch (e) {
    console.log(e)
    return false
  }
}

/**
 * Get local preset file path from user config
 * @param isGetTech - If `true`, return tech stack
 * @returns The local preset file path
 */
export function getRuntimeConfig(isGetTech?: boolean): string {
  try {
    const rcConfig = readRuntimeConfigFile()
    const targetKey: string = isGetTech ? 'localTech' : key
    const filePath: string = rcConfig[targetKey]
      ? resolve(rcConfig[targetKey])
      : ''
    return filePath
  } catch (e) {
    return ''
  }
}

/**
 * Set local preset file path into user config
 * @param filePath - The local config file path
 */
export function setRuntimeConfig(filePath: string): boolean {
  if (!filePath.endsWith('.json')) {
    console.log()
    console.log(`  ` + chalk.red('The file path must be a ".json" file.'))
    console.log()
    return false
  }
  return saveRuntimeConfigFile(key, filePath)
}

/**
 * Remove local preset file path from user config
 */
export function removeRuntimeConfig(): boolean {
  return saveRuntimeConfigFile(key, '')
}
