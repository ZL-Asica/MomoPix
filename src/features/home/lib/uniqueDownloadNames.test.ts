import { describe, expect, it } from 'vitest'
import { uniqueDownloadNames } from './uniqueDownloadNames'

describe('uniqueDownloadNames', () => {
  it('suffixes duplicate ZIP entries without changing their extensions', () => {
    expect(uniqueDownloadNames(['photo.webp', 'photo.webp', 'PHOTO.webp', 'notes'])).toEqual([
      'photo.webp',
      'photo (2).webp',
      'PHOTO (3).webp',
      'notes',
    ])
  })
})
