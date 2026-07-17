import { describe, expect, it } from 'vitest'
import { fitWithinPixelBudget } from './resize'

describe('fitWithinPixelBudget', () => {
  it('keeps images already within the pixel budget', () => {
    expect(fitWithinPixelBudget(6000, 4000)).toEqual({
      width: 6000,
      height: 4000,
      resized: false,
    })
  })

  it('downscales oversized images without changing their aspect ratio', () => {
    const result = fitWithinPixelBudget(12_000, 8_000)

    expect(result.resized).toBe(true)
    expect(result.width * result.height).toBeLessThanOrEqual(24_000_000)
    expect(result.width / result.height).toBeCloseTo(1.5, 3)
  })
})
