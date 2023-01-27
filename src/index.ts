// import minimist from 'minimist'
import chalk from 'chalk'
import { program } from 'commander'
import { version } from '../package.json'
import { suggestCommands } from './libs/cmd'
import init from './core/init'
import configure, { CMDS as CONFIG_SUB_CMDS } from './core/configure'
import proxy, { CMDS as PROXY_SUB_CMDS } from './core/proxy'
import upgrade from './core/upgrade'
import type { SubcommandItem } from '@/types'

export const foo = 'foo'

/**
 * Main entry of the program
 */
function start() {
  program
    .name('preset')
    .version(version, '-v, --version', 'output the version number')
    .usage('<command> [options]')
    .option('-h, --help', 'output usage information')

  /**
   * The `init` command
   */
  program
    .command('init [app-name]', { isDefault: true })
    .alias('i')
    .description('generate a project from a preset template')
    .option('-t, --template', 'specify a template name')
    .action((source) => {
      init(source).catch((e) => {
        console.error(e)
      })
    })

  /**
   * The `config` command
   */
  const configCMD = program.command('config')
  configCMD
    .alias('c')
    .description('use the local preset config')
    .option('-t, --tech', 'configure the local technology stack')
  CONFIG_SUB_CMDS.forEach((item: SubcommandItem) => {
    const { cmd, desc } = item
    configCMD
      .command(cmd)
      .description(desc)
      .action((filePath) => {
        configure({
          cmd,
          filePath,
        }).catch((e: any) => {
          console.error(e)
        })
      })
  })

  /**
   * The `config` command
   */
  const proxyCMD = program.command('proxy')
  proxyCMD.alias('p').description('use proxy to download template')
  PROXY_SUB_CMDS.forEach((item: SubcommandItem) => {
    const { cmd, desc } = item
    proxyCMD
      .command(cmd)
      .description(desc)
      .action(() => {
        proxy({
          cmd,
        }).catch((e: any) => {
          console.error(e)
        })
      })
  })

  /**
   * The `upgrade` command
   */
  program
    .command('upgrade')
    .alias('u')
    .description('updated version')
    .action(() => {
      upgrade().catch((e) => {
        console.error(e)
      })
    })

  // Output help information on unknown commands
  program.on('command:*', ([cmd]) => {
    program.outputHelp()
    console.log(`  ` + chalk.red(`Unknown command ${chalk.yellow(cmd)}.`))
    suggestCommands(cmd)
    console.log()
    process.exitCode = 1
  })

  // Add some useful info on help
  program.on('--help', () => {
    console.log()
    console.log(
      `  Run ${chalk.cyan(
        `preset init <app-name>`
      )} to initialize your project.`
    )
    console.log()
  })

  program.commands.forEach((c) => c.on('--help', () => console.log()))

  program.parse(process.argv)
}
start()
