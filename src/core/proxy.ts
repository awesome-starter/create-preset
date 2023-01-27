import chalk from 'chalk'
import { saveRC } from '@libs/local'
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

  saveRC('proxy', '')
  console.log()
  console.log(
    `  ${chalk.red(
      `Sorry, this feature is temporarily unavailable due to lack of available mirror proxy services.`
    )}`
  )
  console.log(
    `  ${chalk.red(
      `If your download speed is really slow, try turning on a VPN service locally.`
    )}`
  )
  console.log()

  // switch (cmd) {
  //   case 'on':
  //   case 'off': {
  //     // https://doc.fastgit.org/
  //     const proxyTarget: string = cmd === 'on' ? 'hub.fastgit.xyz' : ''
  //     const isSuccess = saveRC('proxy', proxyTarget)
  //     if (isSuccess) {
  //       console.log()
  //       console.log(`  ${chalk.green(`Turn ${cmd} proxy successfully.`)}`)
  //       console.log()
  //     }
  //     break
  //   }
  // }
}
