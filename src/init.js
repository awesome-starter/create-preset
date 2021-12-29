#!/usr/bin/env node

// @ts-check
const fs = require('fs')
const path = require('path')
// Avoids autoconversion to number of the project name by defining that the args
// non associated with an option ( _ ) needs to be parsed as a string. See #4606
const argv = require('minimist')(process.argv.slice(2), { string: ['_'] })
const prompts = require('prompts')
const { red } = require('kolorist')
const {
  copy,
  emptyDir,
  isEmpty,
  isValidPackageName,
  toValidPackageName,
  pkgFromUserAgent,
} = require('./utils')
const { frameworks, templates, renameFiles } = require('./config')
const cwd = process.cwd()

async function init(targetDirFromCMD) {
  let targetDir = targetDirFromCMD || argv._[1]
  let template = argv.template || argv.t

  const defaultProjectName = !targetDir ? 'my-preset-app' : targetDir

  let result = {}

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
              throw new Error(red('✖') + ' Operation cancelled')
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
          name: 'framework',
          message:
            typeof template === 'string' && !templates.includes(template)
              ? `"${template}" isn't a valid template. Please choose from below: `
              : 'Select a framework:',
          initial: 0,
          choices: frameworks.map((framework) => {
            const frameworkColor = framework.color
            return {
              title: frameworkColor(framework.name),
              value: framework,
            }
          }),
        },
        {
          type: (framework) =>
            framework && framework.variants ? 'select' : null,
          name: 'variant',
          message: 'Select a variant:',
          // @ts-ignore
          choices: (framework) =>
            framework.variants.map((variant) => {
              const variantColor = variant.color
              return {
                title: variantColor(variant.name),
                value: variant.name,
              }
            }),
        },
      ],
      {
        onCancel: () => {
          throw new Error(red('✖') + ' Operation cancelled')
        },
      }
    )
  } catch (cancelled) {
    console.log(cancelled.message)
    return
  }

  // user choice associated with prompts
  const { framework, overwrite, packageName, variant } = result

  const root = path.join(cwd, targetDir)

  if (overwrite) {
    emptyDir(root)
  } else if (!fs.existsSync(root)) {
    fs.mkdirSync(root)
  }

  // determine template
  template = variant || framework || template

  console.log(`\nScaffolding project in ${root}...`)

  const templateDir = path.join(__dirname, `templates/${template}`)

  const write = (file, content) => {
    const targetPath = renameFiles[file]
      ? path.join(root, renameFiles[file])
      : path.join(root, file)
    if (content) {
      fs.writeFileSync(targetPath, content)
    } else {
      copy(path.join(templateDir, file), targetPath)
    }
  }

  const files = fs.readdirSync(templateDir)
  for (const file of files.filter((f) => f !== 'package.json')) {
    write(file)
  }

  const pkg = require(path.join(templateDir, `package.json`))

  pkg.name = packageName || targetDir

  write('package.json', JSON.stringify(pkg, null, 2))

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
