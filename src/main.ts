// import minimist from 'minimist'
import chalk from 'chalk'
import { program } from 'commander'
import { version } from '../package.json'
import argv from './libs/argv'
import { suggestCommands } from './libs/cmd'
import init from './core/init'
import configure from './core/configure'
import upgrade from './core/upgrade'

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
    .command('init [app-name]')
    .alias('i')
    .description('generate a project from a preset template')
    .action((source) => {
      if (argv._.length > 2) {
        console.log(
          chalk.yellow(
            "\nInfo: You provided more than one argument. The first one will be used as the app's name, the rest are ignored."
          )
        )
      }
      init(source).catch((e) => {
        console.error(e)
      })
    })

  /**
   * The `config` command
   */
  const configCMD = program.command('config')
  configCMD.alias('c').description('use the local preset config')
  configCMD
    .command('get')
    .description('output the local config file path')
    .action(() => {
      configure({
        cmd: 'get',
      }).catch((e: any) => {
        console.error(e)
      })
    })
  configCMD
    .command('set <file-path>')
    .description('save the local config file path')
    .action((filePath) => {
      configure({
        cmd: 'set',
        filePath,
      }).catch((e: any) => {
        console.error(e)
      })
    })
  configCMD
    .command('remove')
    .description('remove the local config file path')
    .action(() => {
      configure({
        cmd: 'remove',
      }).catch((e: any) => {
        console.error(e)
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
