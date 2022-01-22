import chalk from 'chalk'
import fs from 'fs'
import os from 'os'
import { resolve } from 'path'

const homedir = os.homedir()
const rcFile = resolve(homedir, '.presetrc')

/**
 * Get local preset file path from user config
 * @returns The local preset file path
 */
export function get(): string {
  try {
    const data = fs.readFileSync(rcFile, 'utf-8')
    const rcConfig = JSON.parse(data)
    const { localPreset } = rcConfig
    return resolve(localPreset)
  } catch (e) {
    return ''
  }
}

/**
 * Set local preset file path into user config
 * @param filePath - The local config file path
 */
export function set(filePath: string): void {
  if (!filePath.endsWith('.json')) {
    console.log()
    console.log(`  ` + chalk.red('The file path must be a ".json" file.'))
    console.log()
    return
  }

  try {
    let rcConfig = {}
    try {
      const data = fs.readFileSync(rcFile, 'utf-8')
      rcConfig = JSON.parse(data)
    } catch (e) {
      // console.log(e)
    }
    rcConfig['localPreset'] = resolve(filePath)
    fs.writeFileSync(rcFile, JSON.stringify(rcConfig, null, 2))
  } catch (e) {
    fs.writeFileSync(
      rcFile,
      JSON.stringify(
        {
          localPreset: '',
        },
        null,
        2
      )
    )
  }
  console.log()
  console.log('  ' + chalk.green('Saved successfully.'))
  console.log()
}

/**
 * Remove local preset file path from user config
 */
export function remove(): void {
  try {
    let rcConfig = {}
    try {
      const data = fs.readFileSync(rcFile, 'utf-8')
      rcConfig = JSON.parse(data)
    } catch (e) {
      // console.log(e)
    }
    rcConfig['localPreset'] = ''
    fs.writeFileSync(rcFile, JSON.stringify(rcConfig, null, 2))
  } catch (e) {
    fs.writeFileSync(
      rcFile,
      JSON.stringify(
        {
          localPreset: '',
        },
        null,
        2
      )
    )
  }
}
