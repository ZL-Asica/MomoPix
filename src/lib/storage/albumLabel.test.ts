import type { AlbumRecord } from './types'
import { describe, expect, it } from 'vitest'
import { formatAlbumPath } from './albumLabel'

function album(id: string, name: string, path: string[]): AlbumRecord {
  return {
    id,
    name,
    path,
    parentId: path.at(-2) ?? null,
    depth: path.length - 1,
    imageCount: 0,
    bytesUsed: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

describe('formatAlbumPath', () => {
  it('disambiguates nested albums with a breadcrumb', () => {
    const albums = [
      album('alb_root', 'Default', ['alb_root']),
      album('travel', 'Travel', ['alb_root', 'travel']),
      album('summer', 'Summer', ['alb_root', 'travel', 'summer']),
    ]

    expect(formatAlbumPath(albums[2], albums)).toBe('Default / Travel / Summer')
  })
})
