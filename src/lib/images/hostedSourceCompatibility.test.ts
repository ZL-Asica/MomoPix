import { describe, expect, it } from 'vitest'
import { isHostedSourceUploadCompatible } from './hostedSourceCompatibility'

describe('isHostedSourceUploadCompatible', () => {
  it('accepts supported hosted sources and rejects opaque source formats', () => {
    expect(isHostedSourceUploadCompatible(new File(['image'], 'image.png', { type: 'image/png' }))).toBe(true)
    expect(isHostedSourceUploadCompatible(new File(['raw'], 'image.raw', { type: 'application/octet-stream' }))).toBe(false)
  })
})
