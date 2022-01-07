#!/usr/bin/env node

// @ts-check
const argv = require('minimist')(process.argv.slice(2), { string: ['_'] })
const chalk = require('chalk')
const { Command } = require('commander')
const { version } = require('../package.json')
const init = require('./core/init')

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
