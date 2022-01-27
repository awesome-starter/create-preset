import fs from 'fs'
import path from 'path'
import prompts from 'prompts'
import chalk from 'chalk'
import {
  isValidPackageName,
  toValidPackageName,
  pkgFromUserAgent,
} from '../libs/pkg'
import { write, remove, emptyDir, isEmpty } from '../libs/dir'
import { getDownloadUrl, download } from '../libs/download'
import { getConfig } from '../libs/config'
import argv from '../libs/argv'
import type { UserInputFromCMD } from '@/types'
const cwd = process.cwd()

/**
 * The action for `init` command
 * @param targetDirFromCMD - The dir name from CMD, if there is input
 */
export default async function init(targetDirFromCMD: string | undefined) {
  const { techStacks, templates } = await getConfig()

  let targetDir = targetDirFromCMD || argv._[1]
  let template = argv.template || argv.t

  const defaultProjectName = !targetDir ? 'my-preset-app' : targetDir

  /**
   * @typedef { import('../types').UserInputFromCMD } UserInputFromCMD
   * @type {UserInputFromCMD}
   */
  let result: UserInputFromCMD = {
    projectName: '',
    packageName: '',
    overwrite: false,
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
          choices: techStacks
            .filter((techStack) => {
              return techStack.variants.length
            })
            .map((techStack) => {
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
                title: `${variantColor(variant.name)}${chalk.grey(
                  ' - ' + variant.desc
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
    variants: techStack ? techStack.variants : [],
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
