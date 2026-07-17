/**
 * Fixed id for the implicit root album node.
 */
export const ROOT_ALBUM_ID = 'alb_root' as const

export type ISODateString = string

export type ImageSource = 'index-compressed' | 'dashboard-upload'
export const IMAGE_LIST_SORTS = [
  'createdAt-desc',
  'createdAt-asc',
  'name-asc',
  'name-desc',
  'sizeBytes-desc',
  'sizeBytes-asc',
  'type-asc',
  'type-desc',
] as const
export type ImageListSort = typeof IMAGE_LIST_SORTS[number]
export type ImageFormatFilter = 'all' | 'avif' | 'bmp' | 'gif' | 'jpeg' | 'png' | 'webp'
export type ImageOrientationFilter = 'all' | 'landscape' | 'portrait' | 'square'
export type ImageDateFilter = 'all' | 'today' | '7d' | '30d' | '1y'
export type ImageResolutionFilter = 'all' | 'under-2mp' | '2-12mp' | '12-24mp' | 'over-24mp'

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
  thumbnail?: ThumbnailImageAsset | null
  original?: OriginalImageAsset | null
}

/** WebP preview asset used by album listings instead of the hosted image. */
export interface ThumbnailImageAsset {
  objectKey: string
  sizeBytes: number
  mime: 'image/webp'
  width: number
  height: number
}

/** Optional source asset retained beside a derived upload. */
export interface OriginalImageAsset {
  objectKey: string
  sizeBytes: number
  ext: string
  mime: string
  width: number | null
  height: number | null
}

/**
 * Album-scoped listing row for fast browsing and filtering.
 */
export interface AlbumImageRecord {
  objectKey: string
  albumId: string
  name: string
  nameLower: string
  /** Bytes occupied by hosted, thumbnail, and any retained original assets. */
  storageBytes: number
  sizeBytes: number
  mime: string
  width: number | null
  height: number | null
  createdAt: ISODateString
  thumbnail: ThumbnailImageAsset | null
  original: OriginalImageAsset | null
}

/**
 * Album image row enriched with a display-ready public URL.
 */
export interface AlbumImageListItem extends AlbumImageRecord {
  /** Public URL for copied links and full-size viewing. */
  publicUrl: string | null
  /** Small WebP preview URL, falling back to `publicUrl` for legacy rows. */
  thumbnailUrl: string | null
  /** Authenticated application route for downloading a retained source. */
  originalDownloadUrl: string | null
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
  format?: ImageFormatFilter
  orientation?: ImageOrientationFilter
  date?: ImageDateFilter
  resolution?: ImageResolutionFilter
  allAlbums?: boolean
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
  format: ImageFormatFilter
  orientation: ImageOrientationFilter
  date: ImageDateFilter
  resolution: ImageResolutionFilter
}

/**
 * Result returned by storage bootstrap operations.
 */
export interface StorageBootstrapResult {
  meta: StorageMeta
  rootAlbum: AlbumRecord
}
