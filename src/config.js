const chalk = require('chalk')

/**
 * Tech Stack Config
 *
 * @typedef { import('./types').TechStackItem } TechStackItem
 * @type {TechStackItem[]}
 */
const techStacks = [
  {
    name: 'vue',
    color: chalk.cyan,
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
        name: 'node-server-express',
        description: 'A express template for Node.js project.',
        color: chalk.yellow,
        repo: 'https://github.com/awesome-starter/node-express-starter',
      },
      {
        name: 'node-program-pkg',
        description:
          'A program template for Node.js project, use pkg to packaged.',
        color: chalk.yellow,
        repo: 'https://github.com/awesome-starter/node-pkg-starter',
      },
    ],
  },
  {
    name: 'electron',
    color: chalk.blue,
    variants: [
      {
        name: 'electron-vue3-ts',
        description: 'Electron + Vue 3.0 + TypeScript',
        color: chalk.yellow,
        repo: 'https://github.com/awesome-starter/electron-vue3-ts-starter',
      },
    ],
  },
]

/**
 * Get template names from tech stack list
 */
const templates = techStacks
  .map((f) => (f.variants && f.variants.map((v) => v.name)) || [f.name])
  .reduce((a, b) => a.concat(b), [])

module.exports = {
  techStacks,
  templates,
}
