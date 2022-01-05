const getDownloadUrl = require('../src/libs/getDownloadUrl')

describe('getDownloadUrl.js', () => {
  test('GitHub', async () => {
    expect(
      getDownloadUrl({
        variant: 'test',
        variants: [
          {
            name: 'test',
            repo: 'https://github.com/awesome-starter/vite-vue3-ts-starter',
          },
        ],
      })
    ).toBe('hub.fastgit.org:awesome-starter/vite-vue3-ts-starter')
  })
})

describe('getDownloadUrl.js', () => {
  test('GitLab', async () => {
    expect(
      getDownloadUrl({
        variant: 'test',
        variants: [
          {
            name: 'test',
            repo: 'https://gitlab.com/flippidippi/download-git-repo',
          },
        ],
      })
    ).toBe('https://gitlab.com/flippidippi/download-git-repo')
  })
})

describe('getDownloadUrl.js', () => {
  test('Gitee', async () => {
    expect(
      getDownloadUrl({
        variant: 'test',
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

describe('getDownloadUrl.js', () => {
  test('Unknown', async () => {
    expect(
      getDownloadUrl({
        variant: 'test',
        variants: [
          {
            name: 'test',
          },
        ],
      })
    ).toBe('')
  })
})

describe('getDownloadUrl.js', () => {
  test('Empty', async () => {
    expect(
      getDownloadUrl({
        variant: 'test',
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

describe('getDownloadUrl.js', () => {
  test('SSH', async () => {
    expect(
      getDownloadUrl({
        variant: 'test',
        variants: [
          {
            name: 'test',
            repo: 'git@github.com:bcherny/json-schema-to-typescript.git',
          },
        ],
      })
    ).toBe('')
  })
})
