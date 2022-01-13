const { mustUpgrade } = require('../src/libs/pkg')

describe('mustUpgrade.js', () => {
  test('compareVersion 0.1.0', async () => {
    expect(await mustUpgrade('0.1.0')).toBeTruthy()
  })
})

describe('mustUpgrade.js', () => {
  test('compareVersion 0.2.0', async () => {
    expect(await mustUpgrade('0.2.0')).toBeTruthy()
  })
})

describe('mustUpgrade.js', () => {
  test('compareVersion 0.5.0', async () => {
    expect(await mustUpgrade('0.5.0')).toBeFalsy()
  })
})

describe('mustUpgrade.js', () => {
  test('compareVersion 0.6.0', async () => {
    expect(await mustUpgrade('0.6.0')).toBeFalsy()
  })
})

describe('mustUpgrade.js', () => {
  test('compareVersion 0.7.0', async () => {
    expect(await mustUpgrade('0.7.0')).toBeFalsy()
  })
})
