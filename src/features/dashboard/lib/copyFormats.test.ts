import { describe, expect, it } from 'vitest'
import { buildImageCopyLines } from './copyFormats'

describe('buildImageCopyLines', () => {
  it('uses the filename without its extension as Markdown alt text', () => {
    const lines = buildImageCopyLines([
      {
        name: '[summer.photo].webp',
        publicUrl: 'https://images.example/summer.photo.webp',
      },
    ], 'markdown')

    expect(lines).toEqual([
      '![\\[summer.photo\\]](https://images.example/summer.photo.webp)',
    ])
  })
})
