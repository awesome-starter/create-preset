const { exec } = require('child_process')
const prompts = require('prompts')
const ora = require('ora')
const chalk = require('chalk')
const { packageInfo } = require('../libs/pkg')

/**
 * Upgrade the CLi
 */
async function upgrade() {
  const { packageName, currentVersion, latestVersion, needToUpgrade } =
    await packageInfo()
  console.log()

  // No upgrade required, process terminated
  if (!needToUpgrade) {
    // console.log(
    //   `  The current version is already the latest version, no need to upgrade.`
    // )
    // console.log()
    // return
  }

  // Display version information and confirm with users whether they want to upgrade
  console.log(`  The current version: ${chalk.cyan(currentVersion)}`)
  console.log(`  The latest version: ${chalk.cyan(latestVersion)}`)

  let confirmUpgrade = {
    hopeToUpgrade: true,
  }

  try {
    confirmUpgrade = await prompts(
      [
        {
          type: 'confirm',
          name: 'hopeToUpgrade',
          message: 'Found a new version, do you need to upgrade?',
          initial: true,
        },
      ],
      {
        onCancel: () => {
          throw new Error(chalk.red('✖') + ' Operation cancelled')
        },
      }
    )
  } catch (cancelled) {
    // @ts-ignore
    console.log(cancelled.message)
    return
  }
  console.log()

  // Users don't want to upgrade
  const { hopeToUpgrade } = confirmUpgrade
  if (!hopeToUpgrade) return

  // Choose a package manager
  let pkgManager = {
    targetManager: 'npm',
  }

  try {
    pkgManager = await prompts(
      [
        {
          type: 'select',
          name: 'targetManager',
          message: 'Please select your package manager for global installation',
          choices: [
            {
              title: 'npm',
              value: 'npm',
            },
            {
              title: 'yarn',
              value: 'yarn',
            },
            {
              title: 'pnpm',
              value: 'pnpm',
            },
          ],
        },
      ],
      {
        onCancel: () => {
          throw new Error(chalk.red('✖') + ' Operation cancelled')
        },
      }
    )
  } catch (cancelled) {
    // @ts-ignore
    console.log(cancelled.message)
    return
  }

  const { targetManager } = pkgManager

  let cmd = ''
  switch (targetManager) {
    case 'npm':
      cmd = `npm i -g ${packageName}@latest`
      break
    case 'yarn':
      cmd = `yarn global add ${packageName}@latest`
      break
    case 'pnpm':
      cmd = `pnpm i -g ${packageName}@latest`
      break
  }

  console.log()
  const spinner = ora('Upgrading…').start()
  exec(cmd, (err) => {
    if (err) {
      console.log()
      console.log()
      console.log(err)
      console.log()
      spinner.fail(chalk.red('Upgraded failed.'))
      process.exit()
    }
    console.log()
    spinner.succeed(chalk.green('Upgraded successfully.'))
  })
}

module.exports = upgrade
