const ora = require('ora')
const chalk = require('chalk')
const downloadGitRepo = require('download-git-repo')

/**
 * Get Download URL
 *
 * @typedef { import('../types').VariantItem } VariantItem
 * @param {{ template: string; variants: VariantItem[] }} options - The result from CMD
 *  - template: The selected template name from CMD
 *  - variants: The `variants` in `techStack` from config
 * @returns {string} The repo url about selected template starter
 */
function getDownloadUrl({ template, variants }) {
  if (!Array.isArray(variants)) return ''

  const target = variants.find((v) => v.name === template)
  if (!target) return ''

  const repo = target.repo ? String(target.repo) : ''
  if (!repo.startsWith('http')) return ''

  // Use speed up service for GitHub
  const url = repo.includes('github.com/')
    ? repo.replace(/https:\/\/github.com\//, 'hub.fastgit.org:')
    : repo

  return url
}

/**
 * Download GitHub Repo
 *
 * @param {{ repo: string; folder: string }} options - the download options.
 *  - repo: The repo url to download
 *  - folder: The project folder name
 * @returns {Promise<boolean>} - the download status:
 *  true: success
 *  false: error
 */
function download({ repo, folder }) {
  return new Promise((resolve) => {
    console.log()
    const spinner = ora('Downloading…').start()
    downloadGitRepo(repo, folder, { clone: false }, (err) => {
      if (err) {
        console.log()
        console.log()
        console.log(err)
        console.log()
        spinner.fail(chalk.red('Download failed.'))
        resolve(false)
        process.exit()
      }
      console.log()
      spinner.succeed(chalk.green('Download successful.'))
      resolve(true)
    })
  })
}

module.exports = {
  getDownloadUrl,
  download,
}
