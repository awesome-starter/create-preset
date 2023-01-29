import chalk from 'chalk'
import { readFileSync, writeFileSync } from '@withtypes/fs-extra'
import { homedir } from 'os'
import { resolve } from 'path'
import { hasKey } from '@bassist/utils'
import argv from './argv'
import type { RuntimeConfigFileContent, LocalConfigType } from '@/types'

// Get user's config path of program
const rcFile = resolve(homedir(), '.presetrc')

// If `true`, handle the tech config
const isTech = Boolean(argv.tech) || Boolean(argv.t)
const runtimeConfigType: LocalConfigType = isTech ? 'localTech' : 'localPreset'

/**
 * Get `.presetrc` file content
 * @returns JSON of `.presetrc`
 */
export function readRuntimeConfigFile(): RuntimeConfigFileContent {
  let rcConfig: RuntimeConfigFileContent = {}

  try {
    const data = readFileSync(rcFile, 'utf-8')
    rcConfig = JSON.parse(data)
  } catch (e) {
    // console.log(e)
  }

  const keys = ['proxy', 'localTech', 'localPreset']
  keys.forEach((k) => {
    if (!hasKey(rcConfig, k)) {
      rcConfig[k] = ''
    }
  })

  return rcConfig
}

/**
 * Save `.presetrc` file content
 * @param key - Key of `.presetrc` JSON
 * @param value - Value of the key in `.presetrc` JSON
 * @returns Whether the save operation was successful
 */
export function saveRuntimeConfigFile(key: string, value: string) {
  try {
    const rcConfig: RuntimeConfigFileContent = readRuntimeConfigFile()
    rcConfig[key] = value
    writeFileSync(rcFile, JSON.stringify(rcConfig, null, 2))
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
export function getRuntimeConfig(mode: LocalConfigType = 'localPreset') {
  try {
    const rcConfig = readRuntimeConfigFile()
    const targetKey = mode === 'localTech' ? 'localTech' : runtimeConfigType
    const filePath = rcConfig[targetKey]
      ? resolve(String(rcConfig[targetKey]))
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
export function setRuntimeConfig(filePath: string) {
  if (!filePath.endsWith('.json')) {
    console.log()
    console.log(`  ` + chalk.red('The file path must be a ".json" file.'))
    console.log()
    return false
  }
  return saveRuntimeConfigFile(runtimeConfigType, filePath)
}

/**
 * Remove local preset file path from user config
 */
export function removeRuntimeConfig() {
  return saveRuntimeConfigFile(runtimeConfigType, '')
}
