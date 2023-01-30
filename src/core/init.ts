import fs from 'fs'
import path from 'path'
import prompts from '@withtypes/prompts'
import chalk from 'chalk'
import {
  write,
  remove,
  emptyDir,
  isEmpty,
  isValidPackageName,
  toValidPackageName,
  getPackageManagerByUserAgent,
} from '@bassist/node-utils'
import { getDownloadUrl, download } from '@/libs/download'
import { getConfig } from '@/libs/config'
import argv from '@/libs/argv'
import type { UserInputInfoFromCommandLine } from '@/types'

const cwd = process.cwd()

/**
 * The action for `init` command
 * @param targetDirFromCMD - The dir name from CMD, if there is input
 */
export default async function init(targetDirFromCMD: string | undefined) {
  if (argv._.length > 2) {
    console.log(
      chalk.yellow(
        "\nInfo: You provided more than one argument. The first one will be used as the app's name, the rest are ignored."
      )
    )
  }

  const { techStacks, templates, allTemplates } = await getConfig()

  let targetDir = targetDirFromCMD || argv._[1]

  let template = argv.template || argv.t

  const defaultProjectName = !targetDir ? 'my-preset-app' : targetDir

  let result: UserInputInfoFromCommandLine = {
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
                title: `${variantColor(variant.name)}${chalk.gray(
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
    variants: techStack ? techStack.variants : allTemplates,
  })

  // Download template
  await download({
    repo: downloadUrl,
    folder: targetDir,
  })

  // Remove some files out of templates
  const outOfTemplateFiles = [
    '.git',
    '.github',
    '.gitlab',
    '.gitee',
    'LICENSE',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
  ]
  outOfTemplateFiles.forEach((name) => {
    remove(path.join(root, name))
  })

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
  const pkgManagerInfo = getPackageManagerByUserAgent()
  const pkgManager = pkgManagerInfo.name || 'npm'

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
