const fs = require('fs')
const { resolve } = require('path')
const chalk = require('chalk')

/**
 * List of supported tech stacks
 */
const techConfig = [
  {
    name: 'vue',
    color: '#42b983',
  },
  {
    name: 'node',
    color: '#6bbf47',
  },
  {
    name: 'electron',
    color: '#9ee9f8',
  },
  {
    name: 'rollup',
    color: '#ff6533',
  },
]

/**
 * Template name's color
 */
const colorConfig = {
  official: chalk.yellow,
  community: chalk.white,
  local: chalk.magenta,
}

/**
 * Get the basic tech stack config, without variants
 *
 * @typedef { import('../types').TechStackItem } TechStackItem
 * @returns {TechStackItem[]} The tech stack config without variants
 */
function getTechStacks() {
  const techStack = techConfig.map((tech) => {
    return {
      name: tech.name,
      color: chalk.hex(tech.color),
      variants: [],
    }
  })

  return techStack
}

/**
 * Read config file
 *
 * @typedef { import('./types').ConfigItem } ConfigItem
 * @param {string} fileName - The config file name
 * @returns {ConfigItem[]} The config array from root config file
 */
function readConfigFile(fileName) {
  try {
    const filePath = resolve(__dirname, `../../config/${fileName}.json`)
    const data = fs.readFileSync(filePath, 'utf-8')
    const originConfig = JSON.parse(data)
    if (!Array.isArray(originConfig)) {
      return []
    }

    const techNames = techConfig.map((t) => t.name)
    const config = originConfig
      .filter((item) => techNames.includes(item.tech))
      .map((item) => {
        return {
          ...item,
          color: colorConfig[fileName],
        }
      })

    return config
  } catch (e) {
    return []
  }
}

/**
 * Get config
 *
 * @typedef { import('./types').TechStackItem } TechStackItem
 * @returns {{ techStacks: TechStackItem[]; templates: string[]}} Config
 */
function getConfig() {
  // Get template data from root config files
  const official = readConfigFile('official')
  const community = readConfigFile('community')
  const local = readConfigFile('local')

  // Fill tech stack variants
  const techStacks = getTechStacks()
  const templateList = [...local, ...official, ...community]
  templateList.forEach((template) => {
    const { tech, name, desc, repo, color } = template
    const target = techStacks.find((t) => t.name === tech)
    if (!target) return
    target.variants.push({ name, desc, repo, color })
  })

  // Get template names from tech stack list
  const templates = techStacks
    .map((f) => (f.variants && f.variants.map((v) => v.name)) || [f.name])
    .reduce((a, b) => a.concat(b), [])

  return {
    techStacks,
    templates,
  }
}

module.exports = {
  techConfig,
  colorConfig,
  getTechStacks,
  readConfigFile,
  getConfig,
}
