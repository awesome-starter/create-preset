const { download } = require('../src/libs/download')

// describe('getDownloadUrl.js', () => {
//   test('Download Git Repo', async () => {
//     expect(
//       await download({
//         repo: 'hub.fastgit.org:awesome-starter/vite-vue3-ts-starter',
//         folder: 'test-download',
//       })
//     ).toBeTruthy()
//   })
// })

describe('getDownloadUrl.js', () => {
  test('Download Private Git Repo', async () => {
    expect(
      await download({
        repo: 'direct:git@gitee.com:somemore/git-branch-test.git',
        folder: 'test-download',
        clone: true,
      })
    ).toBeTruthy()
  })
})
