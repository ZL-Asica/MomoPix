import { describe, expect, it } from 'vitest'
import {
  getZipInputBytes,
  MAX_QUEUE_ITEMS,
  MAX_QUEUE_SOURCE_BYTES,
  MAX_ZIP_INPUT_BYTES,
  selectWithinQueueBudget,
} from './memoryBudget'

const MiB = 1024 * 1024

describe('home memory budgets', () => {
  it('accepts a representative 200-image, 85 MiB batch', () => {
    const totalBytes = 85 * MiB
    const perFileBytes = Math.floor(totalBytes / 200)
    const candidates = Array.from({ length: 200 }, (_, id) => ({
      id,
      size: id === 199 ? totalBytes - perFileBytes * 199 : perFileBytes,
    }))

    const result = selectWithinQueueBudget({ currentBytes: 0, currentItems: 0, candidates })

    expect(result.accepted).toHaveLength(MAX_QUEUE_ITEMS)
    expect(result.rejected).toHaveLength(0)
    expect(result.totalBytes).toBe(totalBytes)
  })

  it('continues admitting smaller files after one candidate exceeds the byte budget', () => {
    const result = selectWithinQueueBudget({
      currentBytes: MAX_QUEUE_SOURCE_BYTES - MiB,
      currentItems: 1,
      candidates: [
        { id: 'large', size: 2 * MiB },
        { id: 'small', size: MiB },
      ],
    })

    expect(result.accepted.map(item => item.id)).toEqual(['small'])
    expect(result.rejected.map(item => item.id)).toEqual(['large'])
    expect(result.totalBytes).toBe(MAX_QUEUE_SOURCE_BYTES)
  })

  it('caps additional rows after the item limit', () => {
    const result = selectWithinQueueBudget({
      currentBytes: 0,
      currentItems: MAX_QUEUE_ITEMS,
      candidates: [{ size: 1 }],
    })

    expect(result.accepted).toHaveLength(0)
    expect(result.rejected).toHaveLength(1)
  })

  it('calculates the aggregate ZIP duplication budget', () => {
    expect(getZipInputBytes([{ size: MAX_ZIP_INPUT_BYTES - 1 }, { size: 1 }]))
      .toBe(MAX_ZIP_INPUT_BYTES)
  })
})
