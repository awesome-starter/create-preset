import { resolve } from 'path'
import { describe, expect, it } from 'vitest'
import { emptyDir } from '@bassist/node-utils'
import { download } from '../src/libs/download'

const folder = './test/.test-download'
const fullPath = resolve(__dirname, '.', folder)
const timeout = 30000
emptyDir(fullPath)

describe('download', () => {
  // it(
  //   'Download Git Repo with master branch',
  //   async () => {
  //     expect(
  //       await download({
  //         repo: 'github.com:awesome-starter/node-basic-starter',
  //         folder,
  //       })
  //     ).toBeTruthy()
  //     emptyDir(fullPath)
  //   },
  //   timeout
  // )

  // it(
  //   'Download Git Repo with main branch',
  //   async () => {
  //     expect(
  //       await download({
  //         repo: 'github.com:awesome-starter/website#main',
  //         folder,
  //       })
  //     ).toBeTruthy()
  //     emptyDir(fullPath)
  //   },
  //   timeout
  // )

  it(
    'Download git repo from Gitee, with `.git` extension',
    async () => {
      expect(
        await download({
          repo: 'direct:https://gitee.com/awesome-starter/vue3-ts-vite-starter.git',
          folder,
          clone: true,
        })
      ).toBeTruthy()
      emptyDir(fullPath)
    },
    timeout
  )

  it(
    'Download git repo from Gitee, without `.git` extension',
    async () => {
      expect(
        await download({
          repo: 'direct:https://gitee.com/awesome-starter/vue3-ts-vite-starter',
          folder,
          clone: true,
        })
      ).toBeTruthy()
      emptyDir(fullPath)
    },
    timeout
  )

  // it(
  //   'Download Private Git Repo, direct clone',
  //   async () => {
  //     expect(
  //       await download({
  //         repo: 'direct:git@gitee.com:somemore/git-branch-test.git',
  //         folder,
  //         clone: true,
  //       })
  //     ).toBeTruthy()
  //     emptyDir(fullPath)
  //   },
  //   timeout
  // )
})
