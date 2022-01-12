const leven = require('leven')
const chalk = require('chalk')

/**
 * Suggest command when user input unknow command
 *
 * @param {any} program - The commander instance
 * @param {string} unknownCommand - Unknown command
 */
function suggestCommands(program, unknownCommand) {
  const availableCommands = program.commands.map((cmd) => cmd._name)

  let suggestion

  availableCommands.forEach((cmd) => {
    const isBestMatch =
      leven(cmd, unknownCommand) < leven(suggestion || '', unknownCommand)
    if (leven(cmd, unknownCommand) < 3 && isBestMatch) {
      suggestion = cmd
    }
  })

  if (suggestion) {
    console.log(`  ` + chalk.red(`Did you mean ${chalk.yellow(suggestion)}?`))
  }
}

module.exports = {
  suggestCommands,
}
