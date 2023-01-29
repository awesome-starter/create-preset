import ora from 'ora'
import chalk from 'chalk'
import latestVersion from 'latest-version'
import compareVersions from 'compare-versions'
import { name as packageName, version } from '../../package.json'
import { PackageUpgradeInfo } from '@/types'

/**
 * Query the CLI upgrade info
 * @param curVersion - The current version number
 * @param assignVersion - Assign a version to test
 */
export async function queryPackageUpgradeInfo(
  curVersion = '',
  assignVersion?: string
): Promise<PackageUpgradeInfo> {
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
