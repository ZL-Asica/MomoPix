import { describe, expect, it } from 'vitest'
import { normalizeDashboardQuery } from './urlState'

describe('normalizeDashboardQuery', () => {
  it('trims a non-empty query', () => {
    expect(normalizeDashboardQuery('  sunset  ')).toBe('sunset')
  })

  it('omits empty query parameters', () => {
    expect(normalizeDashboardQuery('   ')).toBeUndefined()
  })

  it('limits queries to the server-supported length', () => {
    expect(normalizeDashboardQuery('a'.repeat(121))).toHaveLength(120)
  })
})
