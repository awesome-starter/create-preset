import { describe, test } from 'vitest'
import { uniqueTechConfig } from '../src/libs/config'

describe('download master, turn on proxy', () => {
  test('Download Git Repo with master branch, turn on proxy', async () => {
    const unique = await uniqueTechConfig()
    console.log('unique', unique)
  })
})
