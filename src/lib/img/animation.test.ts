import { describe, expect, it } from 'vitest'
import { isAnimatedRaster } from './animation'

describe('isAnimatedRaster', () => {
  it('detects GIFs with more than one image frame', () => {
    const bytes = new Uint8Array([
      ...new TextEncoder().encode('GIF89a'),
      1,
      0,
      1,
      0,
      0,
      0,
      0,
      0x2C,
      0,
      0,
      0,
      0,
      1,
      0,
      1,
      0,
      0,
      2,
      2,
      0x4C,
      1,
      0,
      0x2C,
      0,
      0,
      0,
      0,
      1,
      0,
      1,
      0,
      0,
      2,
      2,
      0x4C,
      1,
      0,
      0x3B,
    ])

    expect(isAnimatedRaster(bytes)).toBe(true)
  })

  it('detects the APNG animation control chunk', () => {
    const bytes = new Uint8Array([
      0x89,
      ...new TextEncoder().encode('PNG'),
      0x0D,
      0x0A,
      0x1A,
      0x0A,
      0,
      0,
      0,
      8,
      ...new TextEncoder().encode('acTL'),
      0,
      0,
      0,
      2,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
    ])

    expect(isAnimatedRaster(bytes)).toBe(true)
  })

  it('detects the WebP animation flag', () => {
    const bytes = new Uint8Array([
      ...new TextEncoder().encode('RIFF'),
      22,
      0,
      0,
      0,
      ...new TextEncoder().encode('WEBPVP8X'),
      10,
      0,
      0,
      0,
      0x02,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
    ])

    expect(isAnimatedRaster(bytes)).toBe(true)
  })

  it('rejects static or malformed input', () => {
    expect(isAnimatedRaster(new Uint8Array([0x89, 0x50, 0x4E, 0x47]))).toBe(false)
  })
})
