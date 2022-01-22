import chalk from 'chalk'
import fs from 'fs'
import os from 'os'
import { resolve } from 'path'
import argv from './argv'

// Get user's config path of program
const homedir = os.homedir()
const rcFile = resolve(homedir, '.presetrc')

// If `true`, handle the tech config
const isTech = Boolean(argv.tech) || Boolean(argv.t)
const key = isTech ? 'localTech' : 'localPreset'
const target = isTech ? 'tech stack' : 'configuration'
const tips = `  Run ${chalk.cyan(
  `preset config${isTech ? ' --tech ' : ' '}set <filePath>`
)} to bind your local ${target}.`

/**
 * Get local preset file path from user config
 * @returns The local preset file path
 */
export function get(hideTips?: boolean): string {
  try {
    const data = fs.readFileSync(rcFile, 'utf-8')
    const rcConfig = JSON.parse(data)
    const filePath: string = rcConfig[key] ? resolve(rcConfig[key]) : ''

    console.log()
    if (filePath) {
      console.log(`  The local ${target} is stored in:`)
      console.log(`  ${chalk.cyan(filePath)}`)
      console.log()
    } else {
      console.log(`  There is currently no local ${target}.`)
    }

    if (!hideTips) {
      console.log(tips)
      console.log()
    }

    return filePath
  } catch (e) {
    console.log(e)
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
    rcConfig[key] = resolve(filePath)
    fs.writeFileSync(rcFile, JSON.stringify(rcConfig, null, 2))
    console.log()
    console.log(`  ${chalk.green(`Saved ${target} successfully.`)}`)
    console.log()
  } catch (e) {
    console.log(e)
  }
}

/**
 * Remove local preset file path from user config
 */
export function remove(): void {
  const filePath = get(true)
  if (!filePath) {
    console.log(tips)
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
    rcConfig[key] = ''
    fs.writeFileSync(rcFile, JSON.stringify(rcConfig, null, 2))

    console.log(`  ${chalk.green(`Removed ${target} successfully.`)}`)
    console.log()
  } catch (e) {
    console.log(e)
  }
}
