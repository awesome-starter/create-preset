import ora from 'ora'
import chalk from 'chalk'
import latestVersion from 'latest-version'
import compareVersions from 'compare-versions'
import { name as packageName, version } from '../../package.json'
import { PKGFromProgram, PKGFromUserAgent } from '@/types'

/**
 * Get the package info
 * @param curVersion - The current version number
 * @param assignVersion - Assign a version to test
 * @returns The package info
 */
export async function packageInfo(
  curVersion = '',
  assignVersion?: string
): Promise<PKGFromProgram> {
  console.log()
  const spinner = ora('Detecting upgrade information…').start()
  // The current version
  let cv: string = curVersion || version || '0.0.0'

  // The latest version
  let lv: string = assignVersion || '0.0.0'

  // Check the current version is need to upgrade
  let needToUpgrade = false

  if (!assignVersion) {
    try {
      lv = await latestVersion(packageName)
      needToUpgrade = compareVersions(cv, lv) === -1
    } catch (e) {
      // console.log(e)
    }
  }

  console.log()
  spinner.succeed(chalk.green('Detected successfully.'))

  return {
    packageName,
    currentVersion: cv,
    latestVersion: lv,
    needToUpgrade,
  }
}

/**
 * Check the package name is valid
 * @param projectName - The project folder name
 * @returns isValid
 *  true: valid
 *  false: invalid
 */
export function isValidPackageName(projectName: string): boolean {
  return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(
    projectName
  )
}

/**
 * Format the package name to valid
 * @param projectName - The project folder name
 * @returns a valid package name
 */
export function toValidPackageName(projectName: string): string {
  console.log('projectName', projectName)

  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z0-9-~]+/g, '-')
}

/**
 * Get the package infor from userAgent
 * @param userAgent - process.env.npm_config_user_agent
 * @returns package info
 */
export function pkgFromUserAgent(
  userAgent: string | undefined
): PKGFromUserAgent | undefined {
  if (!userAgent) return undefined
  const pkgSpec = userAgent.split(' ')[0]
  const pkgSpecArr = pkgSpec.split('/')
  return {
    name: pkgSpecArr[0] || '',
    version: pkgSpecArr[1] || '',
  }
}
