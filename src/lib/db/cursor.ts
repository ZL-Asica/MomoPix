import type { ImageListSort } from '@/lib/storage/types'
import { Buffer } from 'node:buffer'
import { IMAGE_LIST_SORTS } from '@/lib/storage/types'

export interface ImageListCursor {
  sort: ImageListSort
  value: number | string
  id: string
}

/**
 * Encodes an opaque keyset cursor for the selected stable image ordering.
 */
export function encodeImageListCursor(cursor: ImageListCursor): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url')
}

/**
 * Decodes and validates an opaque keyset cursor.
 */
export function decodeImageListCursor(value: string): ImageListCursor {
  try {
    const raw = Buffer.from(value, 'base64url').toString('utf8')
    const parsed = JSON.parse(raw) as Partial<ImageListCursor>
    if (typeof parsed.id !== 'string' || parsed.id.length === 0) {
      throw new TypeError('Invalid image cursor id')
    }
    if (!IMAGE_LIST_SORTS.includes(parsed.sort as ImageListSort)) {
      throw new TypeError('Invalid image cursor sort')
    }
    if (
      (typeof parsed.value !== 'number' || !Number.isFinite(parsed.value))
      && typeof parsed.value !== 'string'
    ) {
      throw new TypeError('Invalid image cursor value')
    }
    return {
      id: parsed.id,
      sort: parsed.sort as ImageListSort,
      value: typeof parsed.value === 'number' ? Math.trunc(parsed.value) : parsed.value,
    }
  }
  catch {
    throw new TypeError('Invalid pagination cursor')
  }
}
