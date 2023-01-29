import { describe, expect, test } from 'vitest'
import { getDownloadUrl } from '../src/libs/download'
import { readRuntimeConfigFile } from '../src/libs/local'

describe('getDownloadUrl', () => {
  test('GitHub', () => {
    const { proxy } = readRuntimeConfigFile()
    expect(
      getDownloadUrl({
        template: 'test',
        variants: [
          {
            name: 'test',
            repo: 'https://github.com/awesome-starter/vite-vue3-ts-starter',
          },
        ],
      })
    ).toBe(
      proxy
        ? 'github.com.cnpmjs.org:awesome-starter/vite-vue3-ts-starter'
        : 'github:awesome-starter/vite-vue3-ts-starter'
    )
  })
})

describe('getDownloadUrl', () => {
  test('GitLab', () => {
    expect(
      getDownloadUrl({
        template: 'test',
        variants: [
          {
            name: 'test',
            repo: 'https://gitlab.com/flippidippi/download-git-repo',
          },
        ],
      })
    ).toBe('gitlab:flippidippi/download-git-repo')
  })
})

describe('getDownloadUrl', () => {
  test('Gitee', () => {
    expect(
      getDownloadUrl({
        template: 'test',
        variants: [
          {
            name: 'test',
            repo: 'https://gitee.com/mindspore/mindspore',
          },
        ],
      })
    ).toBe('https://gitee.com/mindspore/mindspore')
  })
})

describe('getDownloadUrl', () => {
  test('Unknown', () => {
    expect(
      getDownloadUrl({
        template: 'test',
        variants: [
          {
            name: 'test',
          },
        ],
      })
    ).toBe('')
  })
})

describe('getDownloadUrl', () => {
  test('Empty', () => {
    expect(
      getDownloadUrl({
        template: 'test',
        variants: [
          {
            name: 'test',
            repo: '',
          },
        ],
      })
    ).toBe('')
  })
})

describe('getDownloadUrl', () => {
  test('SSH', () => {
    expect(
      getDownloadUrl({
        template: 'test',
        variants: [
          {
            name: 'test1',
            repo: 'git@github.com:bcherny/json-schema-to-typescript.git',
          },
        ],
      })
    ).toBe('')
  })
})

describe('getDownloadUrl', () => {
  test('Private', () => {
    expect(
      getDownloadUrl({
        template: 'test',
        variants: [
          {
            name: 'test',
            repo: 'git@gitee.com:somemore/git-branch-test.git',
          },
        ],
      })
    ).toBe('direct:git@gitee.com:somemore/git-branch-test.git')
  })
})
