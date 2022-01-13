#!/usr/bin/env node

// @ts-check
const fs = require('fs')
const path = require('path')
// Avoids autoconversion to number of the project name by defining that the args
// non associated with an option ( _ ) needs to be parsed as a string. See #4606
const argv = require('minimist')(process.argv.slice(2), { string: ['_'] })
const prompts = require('prompts')
const chalk = require('chalk')
const {
  isValidPackageName,
  toValidPackageName,
  pkgFromUserAgent,
} = require('../libs/pkg')
const { write, remove, emptyDir, isEmpty } = require('../libs/dir')
const { getDownloadUrl, download } = require('../libs/download')
const { getConfig } = require('../libs/config')
const { techStacks, templates } = getConfig()
const cwd = process.cwd()

/**
 * The action for `init` command
 *
 * @param {string | undefined} targetDirFromCMD - The dir name from CMD, if there is input
 */
async function init(targetDirFromCMD) {
  let targetDir = targetDirFromCMD || argv._[1]
  let template = argv.template || argv.t

  const defaultProjectName = !targetDir ? 'my-preset-app' : targetDir

  /**
   * @typedef { import('../types').UserInputFromCMD } UserInputFromCMD
   * @type {UserInputFromCMD}
   */
  let result = {
    projectName: '',
    packageName: '',
    overwrite: false,
    // @ts-ignore
    techStack: undefined,
    variant: '',
  }

  try {
    result = await prompts(
      [
        {
          type: targetDir ? null : 'text',
          name: 'projectName',
          message: 'Project name:',
          initial: defaultProjectName,
          onState: (state) =>
            (targetDir = state.value.trim() || defaultProjectName),
        },
        {
          type: () =>
            !fs.existsSync(targetDir) || isEmpty(targetDir) ? null : 'confirm',
          name: 'overwrite',
          message: () =>
            (targetDir === '.'
              ? 'Current directory'
              : `Target directory "${targetDir}"`) +
            ` is not empty. Remove existing files and continue?`,
        },
        {
          // @ts-ignore
          type: (_, { overwrite } = {}) => {
            if (overwrite === false) {
              throw new Error(chalk.red('✖') + ' Operation cancelled')
            }
            return null
          },
          name: 'overwriteChecker',
        },
        {
          type: () => (isValidPackageName(targetDir) ? null : 'text'),
          name: 'packageName',
          message: 'Package name:',
          initial: () => toValidPackageName(targetDir),
          validate: (dir) =>
            isValidPackageName(dir) || 'Invalid package.json name',
        },
        {
          type: template && templates.includes(template) ? null : 'select',
          name: 'techStack',
          message:
            typeof template === 'string' && !templates.includes(template)
              ? `"${template}" isn't a valid template. Please choose from below: `
              : 'Select a tech stack:',
          initial: 0,
          choices: techStacks.map((techStack) => {
            const techStackColor = techStack.color
            return {
              title: techStackColor(techStack.name),
              value: techStack,
            }
          }),
        },
        {
          type: (techStack) =>
            techStack && techStack.variants ? 'select' : null,
          name: 'variant',
          message: 'Select a variant:',
          // @ts-ignore
          choices: (techStack) =>
            // @ts-ignore
            techStack.variants.map((variant) => {
              const variantColor = variant.color
              return {
                title: `${variantColor(variant.name)} ${chalk.grey(
                  variant.desc
                )}`,
                value: variant.name,
              }
            }),
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

  // user choice associated with prompts
  const { techStack, overwrite, packageName, variant } = result

  const root = path.join(cwd, targetDir)

  if (overwrite) {
    emptyDir(root)
  } else if (!fs.existsSync(root)) {
    fs.mkdirSync(root)
  }

  // determine template
  template = variant || techStack || template

  console.log(`\nScaffolding project in ${root}...`)

  // Get download URL from CMD
  const downloadUrl = getDownloadUrl({
    template,
    variants: techStack.variants,
  })

  // Download template
  await download({
    repo: downloadUrl,
    folder: targetDir,
  })

  // Remove lock files
  remove('file', path.join(root, `package-lock.json`))
  remove('file', path.join(root, `yarn.lock`))
  remove('file', path.join(root, `pnpm-lock.yaml`))

  // Get package info
  const pkg = path.join(root, `package.json`)
  const pkgContent = require(pkg)

  // Reset project info
  pkgContent['name'] = packageName || targetDir
  pkgContent['version'] = '0.0.0'
  pkgContent['description'] = ''
  pkgContent['author'] = ''
  write(pkg, JSON.stringify(pkgContent, null, 2))

  // Notification result
  const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent)
  const pkgManager = pkgInfo ? pkgInfo.name : 'npm'

  console.log(`\nDone. Now run:\n`)
  if (root !== cwd) {
    console.log(`  cd ${path.relative(cwd, root)}`)
  }
  switch (pkgManager) {
    case 'yarn':
      console.log('  yarn')
      console.log('  yarn dev')
      break
    default:
      console.log(`  ${pkgManager} install`)
      console.log(`  ${pkgManager} run dev`)
      break
  }
  console.log()
}

module.exports = init
