const chalk = require('chalk')
const fs = require('fs')
const { resolve } = require('path')
const homedir = require('os').homedir()
const rcFile = resolve(homedir, '.presetrc')

/**
 * Get local preset file path from user config
 *
 * @returns {string} The local preset file path
 */
function get() {
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
 *
 * @param {string} filePath - The local config file path
 */
function set(filePath) {
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
}

/**
 * Remove local preset file path from user config
 */
function remove() {
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

module.exports = {
  rcFile,
  get,
  set,
  remove,
}
