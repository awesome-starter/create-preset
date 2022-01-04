const { green, lightGreen, cyan } = require('kolorist')

const frameworks = [
  {
    name: 'vue',
    color: green,
    variants: [
      {
        name: 'vite-vue3-ts',
        display: 'Vite + Vue 3.0 + TypeScript',
        color: cyan,
      },
    ],
  },
  {
    name: 'node',
    color: green,
    variants: [
      {
        name: 'node-basic',
        display: 'A basic Node.js project template.',
        color: lightGreen,
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
