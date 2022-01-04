const ora = require('ora')
const chalk = require('chalk')
const downloadGitRepo = require('download-git-repo')

/**
 * Download GitHub Repo
 * @param {string} url - The URL to download.
 * @param {string} name - The project folder name.
 * @returns Promise<boolean>, the download status:
 *  true: success
 *  false: error
 */
module.exports = function download({ url, name }) {
  return new Promise((resolve) => {
    const spinner = ora('Downloading…').start()
    downloadGitRepo(url, name, { clone: false }, (err) => {
      if (err) {
        console.log(err)
        spinner.fail(chalk.red('✖') + 'Download error.')
        console.log(chalk.red(err))
        resolve(false)
        process.exit()
      }
      console.log()
      spinner.succeed(chalk.green('Done.'))
      resolve(true)
    })
  })
}
