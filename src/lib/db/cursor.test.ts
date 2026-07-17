import { Buffer } from 'node:buffer'
import { describe, expect, it } from 'vitest'
import { decodeImageListCursor, encodeImageListCursor } from './cursor'

describe('image list cursor', () => {
  it('round-trips numeric and string sort values', () => {
    const numeric = { sort: 'sizeBytes-desc' as const, value: 42_000, id: 'image-a' }
    const text = { sort: 'name-asc' as const, value: 'holiday', id: 'image-b' }

    expect(decodeImageListCursor(encodeImageListCursor(numeric))).toEqual(numeric)
    expect(decodeImageListCursor(encodeImageListCursor(text))).toEqual(text)
  })

  it('rejects cursors with unsupported sort values', () => {
    const malformed = Buffer.from(JSON.stringify({ sort: 'random', value: 1, id: 'image-a' })).toString('base64url')
    expect(() => decodeImageListCursor(malformed)).toThrow('Invalid pagination cursor')
  })
})
