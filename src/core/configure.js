const chalk = require('chalk')
const { rcFile, get, set, remove } = require('../libs/local')

/**
 * The action for `configure` command
 *
 * @param {{ cmd: string; filePath?: string }} action - The action to operate local preset
 */
async function configure({ cmd, filePath }) {
  if (!['get', 'set', 'remove'].includes(cmd)) return

  const tips = `  Run ${chalk.cyan(
    `preset config set <filePath>`
  )} to bind your local preset.`

  switch (cmd) {
    // Get the local config file path in .presetrc
    case 'get': {
      const filePath = get()
      console.log()
      if (filePath) {
        console.log('  The local configuration is stored in:')
        console.log(`  Here → ${chalk.cyan(filePath)}`)
        console.log()
      } else {
        console.log('  There is currently no local configuration.')
      }
      console.log(tips)
      console.log()
      break
    }

    // Set the local config file path into .presetrc
    case 'set': {
      set(filePath)
      console.log()
      console.log('  ' + chalk.green('Saved successfully.'))
      console.log()
      break
    }

    // Set the local config file path into .presetrc
    case 'remove': {
      const filePath = get()
      if (!filePath) {
        configure({
          cmd: 'get',
        })
        return
      }
      remove()
      console.log()
      console.log('  ' + chalk.green('Removed successfully.'))
      console.log()
      console.log(tips)
      console.log()
      break
    }
  }
}

module.exports = configure
