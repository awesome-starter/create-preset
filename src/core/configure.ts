import chalk from 'chalk'
import { get, set, remove } from '@libs/local'
import argv from '@libs/argv'
import type { SubcommandItem } from '@/types'

// If `true`, handle the tech config
const isTech = Boolean(argv.tech) || Boolean(argv.t)
const target = isTech ? 'tech stack' : 'configuration'
const tips = `  Run ${chalk.cyan(
  `preset config${isTech ? ' --tech ' : ' '}set <filePath>`
)} to bind your local ${target}.`

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
  if (!CMDS.map((c) => c.cmd).includes(cmd)) return

  switch (cmd) {
    // Get the local config file path in .presetrc
    case 'get': {
      const localConfigfilePath = get()
      console.log()
      if (localConfigfilePath) {
        console.log('  The local configuration is stored in:')
        console.log(`  Here → ${chalk.cyan(localConfigfilePath)}`)
        console.log()
      } else {
        console.log('  There is currently no local configuration.')
      }
      console.log(tips)
      console.log()
      break
    }

    // Set the local config file path into .presetrc
    case 'set <file-path>': {
      const isSuccess = set(String(filePath))
      if (isSuccess) {
        console.log()
        console.log(`  ${chalk.green(`Saved ${target} successfully.`)}`)
        console.log()
      }
      break
    }

    // Set the local config file path into .presetrc
    case 'remove': {
      const localConfigfilePath = get()
      if (!localConfigfilePath) {
        configure({
          cmd: 'get',
        })
        return
      }
      const isSuccess = remove()
      if (isSuccess) {
        console.log()
        console.log(`  ${chalk.green(`Removed ${target} successfully.`)}`)
        console.log()
        console.log(tips)
        console.log()
      }
      break
    }
  }
}
