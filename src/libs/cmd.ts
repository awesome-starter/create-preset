import leven from 'leven'
import chalk from 'chalk'
import { program } from 'commander'

/**
 * Suggest command when user input unknow command
 *
 * @param unknownCMD - Unknown command
 */
export function suggestCommands(unknownCMD: string) {
  // Find suggested commands
  let suggestion = ''
  const availableCommands: string[] = program.commands.map(
    (cmd: any) => cmd._name
  )
  availableCommands.forEach((cmd) => {
    const isBestMatch =
      leven(cmd, unknownCMD) < leven(suggestion || '', unknownCMD)
    if (leven(cmd, unknownCMD) < 3 && isBestMatch) {
      suggestion = cmd
    }
  })

  // If a suitable command is found, prompt the user
  if (suggestion) {
    console.log(`  ` + chalk.red(`Did you mean ${chalk.yellow(suggestion)}?`))
  }
}
