#!/usr/bin/env node

// @ts-check
const argv = require('minimist')(process.argv.slice(2), { string: ['_'] })
const chalk = require('chalk')
const { Command } = require('commander')
const { suggestCommands } = require('./libs/cmd')
const init = require('./core/init')
const configure = require('./core/configure')
const upgrade = require('./core/upgrade')
const { version } = require('../package.json')

/**
 *
 */
function start() {
  const program = new Command()

  program
    .name('preset')
    .version(version, '-v, --version', 'output the version number')
    .usage('<command> [options]')
    .option('-h, --help', 'output usage information')

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

  // The `config` command has sub commands
  const configCMD = program.command('config')
  configCMD.alias('c').description('use the local preset config')
  configCMD
    .command('get')
    .description('output the local config file path')
    .action(() => {
      configure({
        cmd: 'get',
      }).catch((e) => {
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
      }).catch((e) => {
        console.error(e)
      })
    })
  configCMD
    .command('remove')
    .description('remove the local config file path')
    .action(() => {
      configure({
        cmd: 'remove',
      }).catch((e) => {
        console.error(e)
      })
    })

  program
    .command('upgrade')
    .alias('u')
    .description('updated version')
    .action(() => {
      upgrade().catch((e) => {
        console.error(e)
      })
    })

  // output help information on unknown commands
  program.on('command:*', ([cmd]) => {
    program.outputHelp()
    console.log(`  ` + chalk.red(`Unknown command ${chalk.yellow(cmd)}.`))
    suggestCommands(program, cmd)
    console.log()
    process.exitCode = 1
  })

  // add some useful info on help
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
