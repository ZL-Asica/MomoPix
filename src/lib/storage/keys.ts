import { ROOT_ALBUM_ID, SINGLE_USER_ID } from '@/lib/storage/types'

/**
 * Root namespace for all MomoPix KV keys.
 */
const STORAGE_PREFIX = `v1:u:${SINGLE_USER_ID}` as const

/**
 * Fixed key prefixes used by the metadata model.
 */
export const STORAGE_KEYS = {
  prefix: STORAGE_PREFIX,
  meta: `${STORAGE_PREFIX}:meta`,
  albumPrefix: `${STORAGE_PREFIX}:album:`,
  imagePrefix: `${STORAGE_PREFIX}:image:`,
  albumImagePrefix: `${STORAGE_PREFIX}:album-image:`,
  albumImageMigrationPrefix: `${STORAGE_PREFIX}:album-image-migrated:`,
}

const ALBUM_IMAGE_DESC_TS_MAX_MS = 9_999_999_999_999

/**
 * Builds the KV key for an album metadata record.
 */
export function albumKey(albumId: string): string {
  return `${STORAGE_KEYS.albumPrefix}${albumId}`
}

/**
 * Builds the KV key for a full image metadata record.
 */
export function imageKey(objectKey: string): string {
  return `${STORAGE_KEYS.imagePrefix}${objectKey}`
}

/**
 * Builds the legacy album-scoped image index key.
 */
export function albumImageKey(albumId: string, objectKey: string): string {
  return `${STORAGE_KEYS.albumImagePrefix}${albumId}:${objectKey}`
}

/**
 * Encodes `createdAt` so ascending KV key order yields newest-first listings.
 */
export function albumImageDescTsToken(createdAt: string): string {
  const createdAtMs = Date.parse(createdAt)
  const safeMs = Number.isFinite(createdAtMs)
    ? Math.min(Math.max(0, createdAtMs), ALBUM_IMAGE_DESC_TS_MAX_MS)
    : 0
  return String(ALBUM_IMAGE_DESC_TS_MAX_MS - safeMs).padStart(13, '0')
}

/**
 * Builds the ordered album image index key used for cursor pagination.
 */
export function albumImageKeyV2(albumId: string, createdAt: string, objectKey: string): string {
  return `${STORAGE_KEYS.albumImagePrefix}${albumId}:${albumImageDescTsToken(createdAt)}:${objectKey}`
}

/**
 * Returns the prefix used to list all image index rows for an album.
 */
export function albumImagePrefixForAlbum(albumId: string): string {
  return `${STORAGE_KEYS.albumImagePrefix}${albumId}:`
}

/**
 * Returns the marker key used to track legacy album-index migration per album.
 */
export function albumImageMigrationKey(albumId: string): string {
  return `${STORAGE_KEYS.albumImageMigrationPrefix}${albumId}`
}

/**
 * Parses an album image index key, handling both legacy and ordered key layouts.
 */
export function parseAlbumImageIndexKey(
  key: string,
  albumId: string,
): { objectKey: string, descTsToken: string | null } | null {
  const prefix = albumImagePrefixForAlbum(albumId)
  if (!key.startsWith(prefix)) {
    return null
  }

  const suffix = key.slice(prefix.length)
  const separatorIndex = suffix.indexOf(':')
  if (separatorIndex < 0) {
    return suffix.length > 0
      ? { objectKey: suffix, descTsToken: null }
      : null
  }

  const firstToken = suffix.slice(0, separatorIndex)
  const rest = suffix.slice(separatorIndex + 1)
  if (/^\d{13}$/.test(firstToken)) {
    return {
      objectKey: rest,
      descTsToken: firstToken,
    }
  }

  return {
    objectKey: suffix,
    descTsToken: null,
  }
}

/**
 * Returns true when the given album id represents the immutable root album.
 */
export function isRootAlbum(albumId: string): boolean {
  return albumId === ROOT_ALBUM_ID
}
