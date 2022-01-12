const chalk = require('chalk')
const { getLocalConfigFilePath } = require('../libs/getConfig')

/**
 * The action for `configure` command
 *
 * @param {{ get: boolean; set: boolean }} action - The action to operate local preset
 */
async function configure({ get, set }) {
  if (!get && !set) {
    console.log(
      chalk.yellow(
        `Info: Please use --get or --set option to operate your local config.`
      )
    )
    return
  }

  if (get) {
    const filePath = getLocalConfigFilePath()
    console.log()
    console.log('  The local configuration is stored in:')
    console.log(`  Here → ${chalk.cyan(filePath)}`)
    console.log()
    console.log(
      `  Run ${chalk.cyan(
        `preset config --set <filePath>`
      )} to update your local preset.`
    )
    console.log()
  }
}

module.exports = configure
