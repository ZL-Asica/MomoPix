import { describe, expect, it } from 'vitest'
import { shouldKeepOriginalImage } from './output'

describe('shouldKeepOriginalImage', () => {
  it('keeps the source when conversion increases the file size', () => {
    expect(shouldKeepOriginalImage({ originalSize: 100, outputSize: 101 })).toBe(true)
  })

  it('keeps the source when conversion does not save bytes', () => {
    expect(shouldKeepOriginalImage({ originalSize: 100, outputSize: 100 })).toBe(true)
  })

  it('uses transformed output only when it is smaller', () => {
    expect(shouldKeepOriginalImage({ originalSize: 100, outputSize: 99 })).toBe(false)
  })
})
