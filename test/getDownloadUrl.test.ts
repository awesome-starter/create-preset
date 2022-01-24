import { describe, expect, it } from 'vitest'
import { getDownloadUrl } from '../src/libs/download'
import { readRC } from '../src/libs/local'

describe('getDownloadUrl', () => {
  it('GitHub', () => {
    const { proxy } = readRC()
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
  it('GitLab', () => {
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
  it('Gitee', () => {
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
  it('Unknown', () => {
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
  it('Empty', () => {
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
  it('SSH', () => {
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
  it('Private', () => {
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
