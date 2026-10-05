import { describe, expect, test } from 'vitest'
import { getDocsRailFadeState } from './rail-scroll-state'

describe('getDocsRailFadeState', () => {
  test('hides both fades when the rail does not overflow', () => {
    expect(
      getDocsRailFadeState({
        scrollTop: 0,
        clientHeight: 320,
        scrollHeight: 320,
      }),
    ).toEqual({
      showTop: false,
      showBottom: false,
    })
  })

  test('shows only the bottom fade when the rail starts at the top', () => {
    expect(
      getDocsRailFadeState({
        scrollTop: 0,
        clientHeight: 320,
        scrollHeight: 520,
      }),
    ).toEqual({
      showTop: false,
      showBottom: true,
    })
  })

  test('shows both fades when the rail is scrolled through the middle', () => {
    expect(
      getDocsRailFadeState({
        scrollTop: 80,
        clientHeight: 320,
        scrollHeight: 520,
      }),
    ).toEqual({
      showTop: true,
      showBottom: true,
    })
  })

  test('shows only the top fade when the rail is at the bottom', () => {
    expect(
      getDocsRailFadeState({
        scrollTop: 200,
        clientHeight: 320,
        scrollHeight: 520,
      }),
    ).toEqual({
      showTop: true,
      showBottom: false,
    })
  })
})
