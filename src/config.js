const chalk = require('chalk')

/**
 * Framework Config
 * @typedef { import('./types').FrameworkItem } FrameworkItem
 * @type {FrameworkItem[]}
 */
const frameworks = [
  {
    name: 'vue',
    color: chalk.green,
    variants: [
      {
        name: 'vite-vue3-ts',
        description: 'Vite + Vue 3.0 + TypeScript',
        color: chalk.cyan,
        repo: 'https://github.com/awesome-starter/vite-vue3-ts-starter',
      },
    ],
  },
  {
    name: 'node',
    color: chalk.green,
    variants: [
      {
        name: 'node-basic',
        description: 'A basic Node.js project template.',
        color: chalk.green,
        repo: 'https://github.com/awesome-starter/node-basic-starter',
      },
    ],
  },
]

const templates = frameworks
  .map((f) => (f.variants && f.variants.map((v) => v.name)) || [f.name])
  .reduce((a, b) => a.concat(b), [])

const renameFiles = {
  _gitignore: '.gitignore',
  _eslintrc: '.eslintrc.js',
}

module.exports = {
  frameworks,
  templates,
  renameFiles,
}
