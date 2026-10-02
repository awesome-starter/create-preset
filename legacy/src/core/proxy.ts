import chalk from 'chalk'
import { saveRuntimeConfigFile } from '@/libs/local'
import type { SubcommandItem } from '@/types'

/**
 * Subcommands
 */
export const CMDS: SubcommandItem[] = [
  {
    cmd: 'on',
    desc: 'turn on proxy',
  },
  {
    cmd: 'off',
    desc: 'turn off proxy',
  },
]

/**
 * The action for `proxy` command
 * @param action - The action to operate local preset
 *  cmd: Subcommand
 */
export default async function proxy({ cmd }: { cmd: string }) {
  if (!CMDS.map((c) => c.cmd).includes(cmd)) return

  switch (cmd) {
    case 'on':
    case 'off': {
      const isOk = saveRuntimeConfigFile('proxy', cmd)
      if (isOk) {
        console.log()
        console.log(`  ${chalk.green(`Turn ${cmd} proxy successfully.`)}`)
        console.log()
      }
      break
    }
  }
}
