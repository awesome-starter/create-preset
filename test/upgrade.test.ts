import { describe, expect, test } from 'vitest'
import { queryPackageUpgradeInfo } from '../src/libs/pkg'

describe('upgrade', () => {
  test('compareVersion 0.1.0 vs 1.0.0', () => {
    expect(async () => {
      const { needToUpgrade } = await queryPackageUpgradeInfo('0.1.0', '1.0.0')
      return needToUpgrade
    }).toBeTruthy()
  })
})

describe('upgrade', () => {
  test('compareVersion 0.1.1 vs 1.0.0', () => {
    expect(async () => {
      const { needToUpgrade } = await queryPackageUpgradeInfo('0.1.1', '1.0.0')
      return needToUpgrade
    }).toBeTruthy()
  })
})

describe('upgrade', () => {
  test('compareVersion 0.2.0-alpha.0 vs 1.0.0', () => {
    expect(async () => {
      const { needToUpgrade } = await queryPackageUpgradeInfo(
        '0.2.0-alpha.0',
        '1.0.0'
      )
      return needToUpgrade
    }).toBeTruthy()
  })
})

describe('upgrade', () => {
  test('compareVersion 1.0.0-alpha.0 vs 1.0.0-alpha.1', () => {
    expect(async () => {
      const { needToUpgrade } = await queryPackageUpgradeInfo(
        '1.0.0-alpha.0',
        '1.0.0-alpha.1'
      )
      return needToUpgrade
    }).toBeTruthy()
  })
})

describe('upgrade', () => {
  test('compareVersion 1.0.0-alpha.0 vs 1.0.0', () => {
    expect(async () => {
      const { needToUpgrade } = await queryPackageUpgradeInfo(
        '1.0.0-alpha.0',
        '1.0.0'
      )
      return needToUpgrade
    }).toBeTruthy()
  })
})
