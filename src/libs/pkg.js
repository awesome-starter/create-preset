const latestVersion = require('latest-version')
const compareVersions = require('compare-versions')
const { name: packageName, version } = require('../../package.json')

/**
 * Get the package info
 *
 * @param {string} curVersion - The current version number
 * @returns {{packageName: string; currentVersion: string; latestVersion: string; needToUpgrade: boolean}} - The package info
 */
async function packageInfo(curVersion = '') {
  // The current version
  let cv = curVersion || version || '0.0.0'

  // The latest version
  let lv = '0.0.0'

  // Check the current version is need to upgrade
  let needToUpgrade = false

  try {
    lv = await latestVersion(packageName)
    needToUpgrade = compareVersions(cv, lv) === -1
  } catch (e) {
    // console.log(e)
  }

  return {
    packageName,
    currentVersion: cv,
    latestVersion: lv,
    needToUpgrade,
  }
}

/**
 * Check the package name is valid
 *
 * @param {string} projectName - The project folder name
 * @returns {boolean} isValid
 *  true: valid
 *  false: invalid
 */
function isValidPackageName(projectName) {
  return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(
    projectName
  )
}

/**
 * Format the package name to valid
 *
 * @param {string} projectName - The project folder name
 * @returns {string} a valid package name
 */
function toValidPackageName(projectName) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z0-9-~]+/g, '-')
}

/**
 * Get the package infor from userAgent
 *
 * @param {string | undefined} userAgent - process.env.npm_config_user_agent
 * @returns {{ name: string; version: string } | undefined} package info
 */
function pkgFromUserAgent(userAgent) {
  if (!userAgent) return undefined
  const pkgSpec = userAgent.split(' ')[0]
  const pkgSpecArr = pkgSpec.split('/')
  return {
    name: pkgSpecArr[0],
    version: pkgSpecArr[1],
  }
}

module.exports = {
  packageInfo,
  isValidPackageName,
  toValidPackageName,
  pkgFromUserAgent,
}
