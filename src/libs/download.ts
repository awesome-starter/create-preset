import ora from 'ora'
import chalk from 'chalk'
import downloadGitRepo from 'download-git-repo'
import { readRC } from './local'
import type { Presetrc, VariantItem, ConfigItem } from '@/types'

/**
 * Get Download URL
 * @param options - The result from CMD
 *  - template: The selected template name from CMD
 *  - variants: The `variants` in `techStack` from config
 * @returns {string} The repo url about selected template starter
 */
export function getDownloadUrl({
  template,
  variants,
}: {
  template: string
  variants: VariantItem[] | ConfigItem[]
}): string {
  if (!Array.isArray(variants)) return ''

  const target = variants.find((v) => v.name === template)
  if (!target) return ''

  const repo = target.repo ? String(target.repo) : ''
  if (!repo.startsWith('https') && !repo.startsWith('git')) return ''

  let url = repo

  // Use shorthand repository string
  const whitelist: string[] = [
    'https://github.com/',
    'https://gitlab.com/',
    'https://bitbucket.com/',
  ]
  whitelist.forEach((w) => {
    if (repo.startsWith(w)) {
      const short: string = w.replace(/https:\/\/(.*).com\//, '$1')
      url = repo.replace(w, `${short}:`)
    }
  })

  // Use proxy to speed up GitHub download
  const rcConfig: Presetrc = readRC()
  const { proxy } = rcConfig
  if (proxy && repo.startsWith('https://github.com/')) {
    url = repo.replace(/https:\/\/github.com\//, `${proxy}:`)
  }

  // Use direct to clone private repo
  if (repo.startsWith('git@')) {
    url = `direct:${repo}`
  }

  return url
}

/**
 * Download GitHub Repo
 * @param options - the download options.
 *  - repo: The repo url to download
 *  - folder: The project folder name
 *  - clone: If true, use `git clone` to download repo
 * @returns The download status:
 *  true: success
 *  false: error
 */
export function download({
  repo,
  folder,
  clone,
}: {
  repo: string
  folder: string
  clone?: boolean
}): Promise<boolean> {
  return new Promise((resolve) => {
    console.log()
    const spinner = ora('Downloading…').start()
    downloadGitRepo(repo, folder, { clone: clone || false }, (err: any) => {
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
      console.log()
      spinner.succeed(chalk.green('Download successfully.'))
      console.log()
      resolve(true)
    })
  })
}
