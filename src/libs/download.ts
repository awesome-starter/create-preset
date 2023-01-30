import ora from 'ora'
import chalk from 'chalk'
import downloadGitRepo from 'download-git-repo'
import { readRuntimeConfigFile } from './local'
import { isValidDownloadUrl } from './validator'
import type { DownloadOptions, GetDownloadUrlOptions } from '@/types'

function formatDownloadUrl(repo: string) {
  // By default, the repo url is used to download
  let url = repo

  // Use shorthand repository string
  const whitelist = [
    'https://github.com/',
    'https://gitlab.com/',
    'https://bitbucket.com/',
  ]
  whitelist.forEach((w) => {
    if (repo.startsWith(w)) {
      const short = w.replace(/https:\/\/(.*).com\//, '$1')
      url = repo.replace(w, `${short}:`)
    }
  })

  // If the domain name is not in the whitelist
  // Need to add the `direct` option
  // It will bypass the shorthand normalizer and pass url directly
  if (repo.startsWith('http')) {
    url = `direct:${repo}`
  }

  // Use direct to clone private repo
  if (repo.startsWith('git@')) {
    url = `direct:${repo}`
  }

  return url
}

/**
 * Get Download URL
 * @returns The repo url about selected template starter
 */
export function getDownloadUrl({ template, variants }: GetDownloadUrlOptions) {
  if (!Array.isArray(variants)) return ''

  const target = variants.find((v) => v.name === template)
  if (!target) return ''

  // Check if required proxy to speed up GitHub download
  const { proxy } = readRuntimeConfigFile()
  const isUseMirror = proxy === 'on' && isValidDownloadUrl(target.mirror)
  const repo = isUseMirror ? target.mirror : target.repo

  return formatDownloadUrl(repo)
}

/**
 * Download Git Repo
 * @returns Whether the download status is successful
 */
export function download({
  repo,
  folder,
  clone,
}: DownloadOptions): Promise<boolean> {
  return new Promise((resolve) => {
    console.log()
    const spinner = ora('Downloading…').start()

    // Since most hosting platforms require login to download the zip archive
    // So use the clone mode to pull the file correctly
    clone = clone || repo.startsWith('direct') ? true : false

    downloadGitRepo(repo, folder, { clone }, (err: any) => {
      if (err) {
        console.log()
        console.log()
        console.log(err)
        console.log()
        spinner.fail(chalk.red('Download failed.'))
        console.log()
        resolve(false)
        process.exit()
      }

      setTimeout(() => {
        console.log()
        spinner.succeed(chalk.green('Download successfully.'))
        console.log()
        resolve(true)
      }, 100)
    })
  })
}
