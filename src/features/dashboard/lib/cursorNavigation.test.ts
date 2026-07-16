import { describe, expect, it } from 'vitest'
import { getCursorNavigationStart } from './cursorNavigation'

describe('getCursorNavigationStart', () => {
  it('uses the exact cursor for a visited page', () => {
    const cursors = new Map<number, string | null>([[0, null], [1, 'cursor-1']])

    expect(getCursorNavigationStart(cursors, 1)).toEqual({ cursor: 'cursor-1', pageIndex: 1 })
  })

  it('starts an unvisited deep link from the closest prior cursor', () => {
    const cursors = new Map<number, string | null>([[0, null], [2, 'cursor-2'], [4, 'cursor-4']])

    expect(getCursorNavigationStart(cursors, 6)).toEqual({ cursor: 'cursor-4', pageIndex: 4 })
  })
})
