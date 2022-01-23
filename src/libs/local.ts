import chalk from 'chalk'
import fs from 'fs'
import os from 'os'
import { resolve } from 'path'
import argv from './argv'
import type { Presetrc } from '@/types'

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
export function readRC(): Presetrc {
  const data = fs.readFileSync(rcFile, 'utf-8')
  const rcConfig: Presetrc = JSON.parse(data)

  const keys: string[] = ['localTech', 'localPreset']
  keys.forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(rcConfig, key)) {
      rcConfig[key] = ''
    }
  })

  return rcConfig
}

/**
 * Get local preset file path from user config
 * @returns The local preset file path
 */
export function get(): string {
  try {
    const rcConfig = readRC()
    const filePath: string = rcConfig[key] ? resolve(rcConfig[key]) : ''
    return filePath
  } catch (e) {
    return ''
  }
}

/**
 * Set local preset file path into user config
 * @param filePath - The local config file path
 */
export function set(filePath: string): boolean {
  if (!filePath.endsWith('.json')) {
    console.log()
    console.log(`  ` + chalk.red('The file path must be a ".json" file.'))
    console.log()
    return false
  }

  try {
    const rcConfig = readRC()
    rcConfig[key] = resolve(filePath)
    fs.writeFileSync(rcFile, JSON.stringify(rcConfig, null, 2))
    return true
  } catch (e) {
    console.log(e)
    return false
  }
}

/**
 * Remove local preset file path from user config
 */
export function remove(): boolean {
  try {
    const rcConfig = readRC()
    rcConfig[key] = ''
    fs.writeFileSync(rcFile, JSON.stringify(rcConfig, null, 2))
    return true
  } catch (e) {
    console.log(e)
    return false
  }
}
