import chalk from 'chalk'
import { get, set, remove } from '../libs/local'
import type { SubcommandItem } from '@/types'

/**
 * Subcommands
 */
export const CMDS: SubcommandItem[] = [
  {
    cmd: 'get',
    desc: 'output the local config file path',
  },
  {
    cmd: 'set <file-path>',
    desc: 'save the local config file path',
  },
  {
    cmd: 'remove',
    desc: 'remove the local config file path',
  },
]

/**
 * The action for `configure` command
 * @param action - The action to operate local preset
 *  cmd: Subcommand
 *  filePath: The local config path when used for set
 */
export default async function configure({
  cmd,
  filePath,
}: {
  cmd: string
  filePath?: string
}) {
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
      set(String(filePath))
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
