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
  if (!CMDS.map((c) => c.cmd).includes(cmd)) return

  switch (cmd) {
    // Get the local config file path in .presetrc
    case 'get': {
      get()
      break
    }

    // Set the local config file path into .presetrc
    case 'set <file-path>': {
      set(String(filePath))
      break
    }

    // Set the local config file path into .presetrc
    case 'remove': {
      remove()
      break
    }
  }
}
