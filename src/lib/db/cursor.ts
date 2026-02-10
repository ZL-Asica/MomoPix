import { Buffer } from 'node:buffer'

export interface ImageListCursor {
  createdAt: number
  id: string
}

/**
 * Encodes an opaque keyset cursor for descending `(created_at, id)` pagination.
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
    if (typeof parsed.createdAt !== 'number' || !Number.isFinite(parsed.createdAt)) {
      throw new TypeError('Invalid image cursor timestamp')
    }
    return {
      id: parsed.id,
      createdAt: Math.trunc(parsed.createdAt),
    }
  }
  catch {
    throw new TypeError('Invalid pagination cursor')
  }
}
