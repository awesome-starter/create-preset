#!/usr/bin/env node

// @ts-check
const argv = require('minimist')(process.argv.slice(2), { string: ['_'] })
const { cyan } = require('kolorist')
const { Command } = require('commander')
const { version } = require('../package.json')
const init = require('./init')

function start() {
  console.log(argv)
  const program = new Command()
  program
    .option('-v, --version', 'output the version number')
    .option('-h, --help', 'output usage information')
    .option('-d, --debug', 'output extra debugging')
    .option('-s, --small', 'small pizza size')
    .option('-p, --pizza-type <type>', 'flavour of pizza')
    .option('-c, --cheese <type>', 'add the specified type of cheese', 'blue')
  // const a = program.parse(process.argv)
  // console.log('a', a)

  program
    // .command('init <template> <app-name>')
    .command('init')
    .description(
      'generate a project from a remote template (legacy API, requires @vue/cli-init)'
    )
    .option('-c, --clone', 'Use git clone when fetching remote template')
    .option('--offline', 'Use cached template')
    .action(() => {
      init().catch((e) => {
        console.error(e)
      })
    })

  program.parse(process.argv)

  const options = program.opts()
  console.log('options', options)

  // add some useful info on help
  program.on('--help', () => {
    console.log()
    console.log(
      `  Run ${cyan(
        `vue <command> --help`
      )} for detailed usage of given command.`
    )
    console.log()
  })

  program.commands.forEach((c) => c.on('--help', () => console.log()))

  // if (!argv._.length) {
  //   console.log('help');
  //   return
  // }

  // if (argv.v || argv.version) {
  //   console.log(version)
  //   return
  // }
}
start()
