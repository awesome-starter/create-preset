const ora = require('ora')
const chalk = require('chalk')
const downloadGitRepo = require('download-git-repo')

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
module.exports = function download({ repo, folder }) {
  console.log({ repo, folder })
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
