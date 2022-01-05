const download = require('../src/libs/download')

describe('getDownloadUrl.js', () => {
  test('Download Git Repo', async () => {
    expect(
      await download({
        repo: 'hub.fastgit.org:awesome-starter/vite-vue3-ts-starter',
        folder: 'test-download',
      })
    ).toBeTruthy()
  })
})
