/**
 * Fixed id for the implicit root album node.
 */
export const ROOT_ALBUM_ID = 'alb_root' as const

export type ISODateString = string

export type ImageSource = 'index-compressed' | 'dashboard-upload'
export type ImageListSort = 'createdAt-desc'

/** Global storage counters and defaults derived from D1 tables. */
export interface StorageMeta {
  rootAlbumId: typeof ROOT_ALBUM_ID
  defaultAlbumId: string
  totalBytesUsed: number
  totalImageCount: number
  totalAlbumCount: number
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
  objectKey: string
  albumId: string
  name: string
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
  original?: OriginalImageAsset | null
}

/** Optional source asset retained beside a derived upload. */
export interface OriginalImageAsset {
  objectKey: string
  sizeBytes: number
  ext: string
  mime: string
  width: number
  height: number
}

/**
 * Album-scoped listing row for fast browsing and filtering.
 */
export interface AlbumImageRecord {
  objectKey: string
  albumId: string
  name: string
  nameLower: string
  sizeBytes: number
  mime: string
  width: number | null
  height: number | null
  createdAt: ISODateString
}

/**
 * Album image row enriched with a display-ready public URL.
 */
export interface AlbumImageListItem extends AlbumImageRecord {
  publicUrl: string | null
}

/**
 * Request payload for paged album image listing.
 */
export interface ListAlbumImagesInput {
  albumId: string
  cursor?: string | null
  pageSize?: number
  sort?: ImageListSort
  query?: string
}

/**
 * Cursor-paged album image listing payload.
 */
export interface ListAlbumImagesResult {
  items: AlbumImageRecord[]
  nextCursor: string | null
  hasNextPage: boolean
  pageSize: number
  sort: ImageListSort
  query: string
}

/**
 * Result returned by storage bootstrap operations.
 */
export interface StorageBootstrapResult {
  meta: StorageMeta
  rootAlbum: AlbumRecord
}
