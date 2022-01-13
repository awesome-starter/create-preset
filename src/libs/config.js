const fs = require('fs')
const { resolve } = require('path')
const chalk = require('chalk')
const ora = require('ora')
const fetch = require('node-fetch')
const { get: getLocalConfigFilePath } = require('./local')

/**
 * Template name's color
 */
const colorConfig = {
  official: chalk.yellow,
  community: chalk.white,
  local: chalk.cyan,
}

/**
 * Get the list of supported tech stacks
 *
 * @returns {{ name: string; color: string}[]} Tech list
 */
function getTechConfig() {
  try {
    const filePath = resolve(__dirname, `../../config/tech.json`)
    const data = fs.readFileSync(filePath, 'utf-8')
    const config = JSON.parse(data)
    if (!Array.isArray(config)) {
      return []
    }
    return config
  } catch (e) {
    return []
  }
}

/**
 * Get the basic tech stack config, without variants
 *
 * @typedef { import('../types').TechStackItem } TechStackItem
 * @returns {TechStackItem[]} The tech stack config without variants
 */
function getTechStacks() {
  const techConfig = getTechConfig()
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
 * Handle origin config item to be config item
 *
 * @typedef { import('../types').OriginConfigItem } OriginConfigItem
 * @typedef { import('../types').ConfigItem } ConfigItem
 * @param {string} fileName - The config file name
 * @param {OriginConfigItem[]} originConfig - The origin config
 * @returns {ConfigItem[]} The config array from root config file
 */
function handleOriginConfig(fileName, originConfig) {
  if (!Array.isArray(originConfig)) {
    return []
  }

  const techConfig = getTechConfig()
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
}

/**
 * Read config file
 *
 * @typedef { import('../types').ConfigItem } ConfigItem
 * @param {string} fileName - The config file name
 * @returns {ConfigItem[]} The config array from root config file
 */
function readConfigFile(fileName) {
  try {
    const filePath =
      fileName === 'local'
        ? getLocalConfigFilePath()
        : resolve(__dirname, `../../config/${fileName}.json`)
    const data = fs.readFileSync(filePath, 'utf-8')
    const originConfig = JSON.parse(data)
    const config = handleOriginConfig(fileName, originConfig)
    return config
  } catch (e) {
    return []
  }
}

/**
 * Fetch config file from CDN
 *
 * @typedef { import('../types').ConfigItem } ConfigItem
 * @param {string} fileName - The config file name
 * @returns {ConfigItem[]} The config array from root config file
 */
async function fetchConfigFile(fileName) {
  let config

  try {
    const res = await fetch(`https://preset.js.org/config/${fileName}.json`)
    const originConfig = await res.json()
    config = handleOriginConfig(fileName, originConfig)
  } catch (e) {
    config = []
  }

  return config
}

/**
 * Get config
 *
 * @typedef { import('./types').TechStackItem } TechStackItem
 * @returns {{ techStacks: TechStackItem[]; templates: string[]}} Config
 */
async function getConfig() {
  console.log()
  const spinner = ora('Fetching the latest config…').start()

  // Get template data from root config files
  const official = (await fetchConfigFile('official')) || []
  const community = (await fetchConfigFile('community')) || []
  const local = readConfigFile('local') || []

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

  spinner.succeed(chalk.green('Get the latest config successfully.'))
  console.log()

  return {
    techStacks,
    templates,
  }
}

module.exports = {
  colorConfig,
  getTechConfig,
  getTechStacks,
  handleOriginConfig,
  readConfigFile,
  fetchConfigFile,
  getConfig,
}
