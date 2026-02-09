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
}

/**
 * Builds the KV key for an album metadata record.
 */
export function albumKey(albumId: string): string {
  return `${STORAGE_KEYS.albumPrefix}${albumId}`
}

/**
 * Builds the KV key for a full image metadata record.
 */
export function imageKey(imageId: string): string {
  return `${STORAGE_KEYS.imagePrefix}${imageId}`
}

/**
 * Builds the album-scoped image index key.
 */
export function albumImageKey(albumId: string, imageId: string): string {
  return `${STORAGE_KEYS.albumImagePrefix}${albumId}:${imageId}`
}

/**
 * Returns the prefix used to list all image index rows for an album.
 */
export function albumImagePrefixForAlbum(albumId: string): string {
  return `${STORAGE_KEYS.albumImagePrefix}${albumId}:`
}

/**
 * Returns true when the given album id represents the immutable root album.
 */
export function isRootAlbum(albumId: string): boolean {
  return albumId === ROOT_ALBUM_ID
}
