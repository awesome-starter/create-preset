const chalk = require('chalk')

/**
 * Framework Config
 *
 * @typedef { import('./types').FrameworkItem } FrameworkItem
 * @type {FrameworkItem[]}
 */
const frameworks = [
  {
    name: 'vue',
    color: chalk.blue,
    variants: [
      {
        name: 'vite-vue3-ts',
        description: 'Vite + Vue 3.0 + TypeScript',
        color: chalk.yellow,
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
        color: chalk.yellow,
        repo: 'https://github.com/awesome-starter/node-basic-starter',
      },
      {
        name: 'node-express',
        description: 'A express template for Node.js project.',
        color: chalk.yellow,
        repo: 'https://github.com/awesome-starter/node-express-starter',
      },
    ],
  },
]

/**
 * Get template names from frameworks list
 */
const templates = frameworks
  .map((f) => (f.variants && f.variants.map((v) => v.name)) || [f.name])
  .reduce((a, b) => a.concat(b), [])

module.exports = {
  frameworks,
  templates,
}
