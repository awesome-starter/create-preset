const latestVersion = require('latest-version')
const compareVersions = require('compare-versions')
const { name: packageName, version } = require('../../package.json')

/**
 * Check if the current version needs to be upgraded
 *
 * @param {string} curVersion - The current version number
 * @returns {boolean} mustUpgrade
 *  true: need to upgrade
 *  false: no need to upgrade
 */
async function mustUpgrade(curVersion = '') {
  try {
    const curV = curVersion || version || '0.0.0'
    const latestV = await latestVersion(packageName)
    const isOld = compareVersions(curV, latestV) === -1
    return isOld
  } catch {
    return false
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
  mustUpgrade,
  isValidPackageName,
  toValidPackageName,
  pkgFromUserAgent,
}
