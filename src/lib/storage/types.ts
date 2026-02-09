/**
 * KV schema version for MomoPix storage metadata.
 */
export const STORAGE_SCHEMA_VERSION = 1 as const

/**
 * Single-user identifier used for key namespacing.
 */
export const SINGLE_USER_ID = 'single-user' as const

/**
 * Fixed id for the implicit root album node.
 */
export const ROOT_ALBUM_ID = 'alb_root' as const

export type ISODateString = string

export type ImageSource = 'index-compressed' | 'dashboard-upload'

/**
 * Global storage counters and defaults.
 */
export interface StorageMeta {
  schemaVersion: typeof STORAGE_SCHEMA_VERSION
  rootAlbumId: typeof ROOT_ALBUM_ID
  defaultAlbumId: string
  totalBytesUsed: number
  totalImageCount: number
  totalAlbumCount: number
  needsRecount: boolean
  updatedAt: ISODateString
}

export interface AlbumRecord {
  id: string
  name: string
  parentId: string | null
  path: string[]
  depth: number
  imageCount: number
  bytesUsed: number
  createdAt: ISODateString
  updatedAt: ISODateString
}

/**
 * Canonical metadata record for one stored image.
 */
export interface ImageRecord {
  id: string
  albumId: string
  r2Key: string
  originalName: string
  storedName: string
  ext: string
  mime: string
  sizeBytes: number
  width: number | null
  height: number | null
  createdAt: ISODateString
  updatedAt: ISODateString
  source: ImageSource
  albumIndexKey: string
}

/**
 * Album-scoped listing row for fast browsing and filtering.
 */
export interface AlbumImageRecord {
  imageId: string
  albumId: string
  name: string
  nameLower: string
  sizeBytes: number
  mime: string
  width: number | null
  height: number | null
  createdAt: ISODateString
  r2Key: string
}

/**
 * Result returned by storage bootstrap operations.
 */
export interface StorageBootstrapResult {
  meta: StorageMeta
  rootAlbum: AlbumRecord
}
