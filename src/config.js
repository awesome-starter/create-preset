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
    color: chalk.hex('#42b983'),
    variants: [
      {
        name: 'vue3-ts-vite',
        description: 'A template for Vue 3.0 with TypeScript, base on Vite.',
        color: chalk.yellow,
        repo: 'https://github.com/awesome-starter/vue3-ts-vite-starter',
      },
    ],
  },
  {
    name: 'node',
    color: chalk.hex('#6bbf47'),
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
    color: chalk.hex('#9ee9f8'),
    variants: [
      {
        name: 'electron-vue3-ts',
        description:
          'An electron template with Vue 3.0 and TypeScript for client project.',
        color: chalk.yellow,
        repo: 'https://github.com/awesome-starter/electron-vue3-ts-starter',
      },
    ],
  },
  {
    name: 'rollup',
    color: chalk.hex('#ff6533'),
    variants: [
      {
        name: 'rollup-library-ts',
        description:
          'A template for JS Library with TypeScript, base on Rollup.',
        color: chalk.yellow,
        repo: 'https://github.com/awesome-starter/rollup-library-ts-starter',
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
