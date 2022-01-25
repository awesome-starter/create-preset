import { describe, test } from 'vitest'
import { uniqueTechConfig, uniqueConfig } from '../src/libs/config'

describe('unique', () => {
  test('Unique Tech Config', async () => {
    const unique = await uniqueTechConfig()
    console.log('uniqueTechConfig', unique)
  })
})

describe('unique', () => {
  test('Unique Config', async () => {
    const unique = await uniqueConfig()
    console.log('uniqueConfig', unique)
  })
})
