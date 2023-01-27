import { resolve } from 'path'
import { describe, expect, test } from 'vitest'
import { download } from '../src/libs/download'
import { emptyDir } from '@bassist/node-utils'

const folder = 'test-download'
const fullPath = resolve(__dirname, '..', folder)
const timeout = 30000
emptyDir(fullPath)

describe('download master, turn on proxy', () => {
  test(
    'Download Git Repo with master branch, turn on proxy',
    async () => {
      expect(
        await download({
          repo: 'github.com.cnpmjs.org:awesome-starter/node-basic-starter',
          folder,
        })
      ).toBeTruthy()
      emptyDir(fullPath)
    },
    timeout
  )
})

describe('download main, turn on proxy', () => {
  test(
    'Download Git Repo with main branch, turn on proxy',
    async () => {
      expect(
        await download({
          repo: 'github.com.cnpmjs.org:awesome-starter/website#main',
          folder,
        })
      ).toBeTruthy()
      emptyDir(fullPath)
    },
    timeout
  )
})

describe('download master, turn off proxy', () => {
  test(
    'Download Git Repo with master branch, turn off proxy',
    async () => {
      expect(
        await download({
          repo: 'github.com:awesome-starter/node-basic-starter',
          folder,
        })
      ).toBeTruthy()
      emptyDir(fullPath)
    },
    timeout
  )
})

describe('download main, turn off proxy', () => {
  test(
    'Download Git Repo with main branch, turn off proxy',
    async () => {
      expect(
        await download({
          repo: 'github.com:awesome-starter/website#main',
          folder,
        })
      ).toBeTruthy()
      emptyDir(fullPath)
    },
    timeout
  )
})

describe('download private, direct clone', () => {
  test(
    'Download Private Git Repo',
    async () => {
      expect(
        await download({
          repo: 'direct:git@gitee.com:somemore/git-branch-test.git',
          folder,
          clone: true,
        })
      ).toBeTruthy()
      emptyDir(fullPath)
    },
    timeout
  )
})
