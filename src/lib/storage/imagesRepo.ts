import type { SQL } from 'drizzle-orm'
import type {
  AlbumImageRecord,
  ImageListSort,
  ImageRecord,
  ListAlbumImagesInput,
  ListAlbumImagesResult,
} from '@/lib/storage/types'
import { and, asc, desc, eq, isNotNull, isNull, sql } from 'drizzle-orm'
import { getDb } from '@/lib/db/client'
import { decodeImageListCursor, encodeImageListCursor } from '@/lib/db/cursor'
import { imagesTable } from '@/lib/db/schema'

const DEFAULT_IMAGE_PAGE_SIZE = 50
const IMAGE_PAGE_SIZE_MIN = 10
const IMAGE_PAGE_SIZE_MAX = 200
const DEFAULT_IMAGE_LIST_SORT: ImageListSort = 'createdAt-desc'

function normalizePageSize(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_IMAGE_PAGE_SIZE
  }
  return Math.min(IMAGE_PAGE_SIZE_MAX, Math.max(IMAGE_PAGE_SIZE_MIN, Math.trunc(value)))
}

function normalizeSort(value: ImageListSort | undefined): ImageListSort {
  if (value === 'createdAt-desc') {
    return value
  }
  return DEFAULT_IMAGE_LIST_SORT
}

function normalizeQuery(value: string | undefined): string {
  return (value ?? '').trim()
}

function toIsoString(value: number): string {
  return new Date(value).toISOString()
}

function fromIsoString(value: string): number {
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) {
    return Date.now()
  }
  return Math.trunc(parsed)
}

interface ImageRow {
  id: string
  albumId: string
  name: string
  nameLower: string
  ext: string
  bytes: number
  width: number | null
  height: number | null
  createdAt: number
  updatedAt: number
  originalName: string
  storedName: string
  mime: string
  source: 'index-compressed' | 'dashboard-upload'
  originalObjectKey?: string | null
  originalBytes?: number | null
  originalExt?: string | null
  originalMime?: string | null
  originalWidth?: number | null
  originalHeight?: number | null
  thumbnailObjectKey?: string | null
  thumbnailBytes?: number | null
  thumbnailMime?: string | null
  thumbnailWidth?: number | null
  thumbnailHeight?: number | null
}

function toImageRecord(row: ImageRow): ImageRecord {
  const originalValues = [row.originalBytes, row.originalExt, row.originalMime]
  const hasOriginalMetadata = originalValues.some(value => value !== null && value !== undefined)
  if (row.originalObjectKey === null || row.originalObjectKey === undefined) {
    if (hasOriginalMetadata) {
      throw new Error('Image original metadata is incomplete')
    }
  }
  else if (
    !row.originalObjectKey.startsWith('originals/')
    || originalValues.some(value => value === null || value === undefined)
    || (row.originalBytes ?? 0) < 1
    || (row.originalWidth !== null && row.originalWidth !== undefined && row.originalWidth < 1)
    || (row.originalHeight !== null && row.originalHeight !== undefined && row.originalHeight < 1)
    || ((row.originalWidth === null || row.originalWidth === undefined)
      !== (row.originalHeight === null || row.originalHeight === undefined))
    || row.originalExt === null
    || row.originalExt === undefined
    || row.originalExt.length === 0
    || row.originalMime === null
    || row.originalMime === undefined
    || row.originalMime.length === 0
  ) {
    throw new Error('Image original metadata is invalid')
  }

  const thumbnailValues = [row.thumbnailBytes, row.thumbnailMime, row.thumbnailWidth, row.thumbnailHeight]
  const hasThumbnailMetadata = thumbnailValues.some(value => value !== null && value !== undefined)
  if (row.thumbnailObjectKey === null || row.thumbnailObjectKey === undefined) {
    if (hasThumbnailMetadata) {
      throw new Error('Image thumbnail metadata is incomplete')
    }
  }
  else if (
    !row.thumbnailObjectKey.startsWith('thumbnails/')
    || thumbnailValues.some(value => value === null || value === undefined)
    || (row.thumbnailBytes ?? 0) < 1
    || row.thumbnailMime !== 'image/webp'
    || (row.thumbnailWidth ?? 0) < 1
    || (row.thumbnailHeight ?? 0) < 1
  ) {
    throw new Error('Image thumbnail metadata is invalid')
  }

  return {
    objectKey: row.id,
    albumId: row.albumId,
    name: row.name,
    originalName: row.originalName,
    storedName: row.storedName,
    ext: row.ext,
    mime: row.mime,
    sizeBytes: row.bytes,
    width: row.width,
    height: row.height,
    createdAt: toIsoString(row.createdAt),
    updatedAt: toIsoString(row.updatedAt),
    source: row.source,
    thumbnail: row.thumbnailObjectKey === null || row.thumbnailObjectKey === undefined
      ? null
      : {
          objectKey: row.thumbnailObjectKey,
          sizeBytes: row.thumbnailBytes ?? 0,
          mime: 'image/webp',
          width: row.thumbnailWidth ?? 0,
          height: row.thumbnailHeight ?? 0,
        },
    original: row.originalObjectKey === null || row.originalObjectKey === undefined
      ? null
      : {
          objectKey: row.originalObjectKey,
          sizeBytes: row.originalBytes ?? 0,
          ext: row.originalExt ?? '',
          mime: row.originalMime ?? '',
          width: row.originalWidth ?? null,
          height: row.originalHeight ?? null,
        },
  }
}

function validateOriginalAsset(image: ImageRecord): void {
  const original = image.original
  if (!original) {
    return
  }
  if (
    original.objectKey === image.objectKey
    || !original.objectKey.startsWith('originals/')
    || original.sizeBytes < 1
    || (original.width !== null && original.width < 1)
    || (original.height !== null && original.height < 1)
    || ((original.width === null) !== (original.height === null))
    || !original.ext
    || !original.mime
  ) {
    throw new Error('Invalid original image asset')
  }
}

function validateThumbnailAsset(image: ImageRecord): void {
  const thumbnail = image.thumbnail
  if (
    !thumbnail
    || thumbnail.objectKey === image.objectKey
    || !thumbnail.objectKey.startsWith('thumbnails/')
    || thumbnail.sizeBytes < 1
    || thumbnail.width < 1
    || thumbnail.height < 1
    || thumbnail.mime !== 'image/webp'
  ) {
    throw new Error('Invalid thumbnail image asset')
  }
}

function toAlbumImageRecord(row: ImageRow): AlbumImageRecord {
  const image = toImageRecord(row)
  return {
    objectKey: row.id,
    albumId: row.albumId,
    name: row.name,
    nameLower: row.nameLower,
    storageBytes: row.bytes + (row.thumbnailBytes ?? 0) + (row.originalBytes ?? 0),
    sizeBytes: row.bytes,
    mime: row.mime,
    width: row.width,
    height: row.height,
    createdAt: toIsoString(row.createdAt),
    thumbnail: image.thumbnail ?? null,
  }
}

/**
 * Loads the canonical image metadata row.
 */
export async function getImageRecord(_db: D1Database, objectKey: string): Promise<ImageRecord | null> {
  const db = getDb()
  const [row] = await db
    .select({
      id: imagesTable.id,
      albumId: imagesTable.albumId,
      name: imagesTable.name,
      nameLower: imagesTable.nameLower,
      ext: imagesTable.ext,
      bytes: imagesTable.bytes,
      width: imagesTable.width,
      height: imagesTable.height,
      createdAt: imagesTable.createdAt,
      updatedAt: imagesTable.updatedAt,
      originalName: imagesTable.originalName,
      storedName: imagesTable.storedName,
      mime: imagesTable.mime,
      source: imagesTable.source,
      originalObjectKey: imagesTable.originalObjectKey,
      originalBytes: imagesTable.originalBytes,
      originalExt: imagesTable.originalExt,
      originalMime: imagesTable.originalMime,
      originalWidth: imagesTable.originalWidth,
      originalHeight: imagesTable.originalHeight,
      thumbnailObjectKey: imagesTable.thumbnailObjectKey,
      thumbnailBytes: imagesTable.thumbnailBytes,
      thumbnailMime: imagesTable.thumbnailMime,
      thumbnailWidth: imagesTable.thumbnailWidth,
      thumbnailHeight: imagesTable.thumbnailHeight,
    })
    .from(imagesTable)
    .where(and(eq(imagesTable.id, objectKey), isNull(imagesTable.deletedAt)))
    .limit(1)

  return row === undefined ? null : toImageRecord(row)
}

/**
 * Persists one image metadata row.
 */
export async function putImageRecords(
  _db: D1Database,
  image: ImageRecord,
  albumImage: AlbumImageRecord,
): Promise<void> {
  validateOriginalAsset(image)
  validateThumbnailAsset(image)
  const db = getDb()
  const createdAt = fromIsoString(image.createdAt)
  const updatedAt = fromIsoString(image.updatedAt)

  await db
    .insert(imagesTable)
    .values({
      id: image.objectKey,
      albumId: image.albumId,
      name: albumImage.name,
      nameLower: albumImage.nameLower,
      ext: image.ext,
      bytes: image.sizeBytes,
      width: image.width,
      height: image.height,
      createdAt,
      updatedAt,
      originalName: image.originalName,
      storedName: image.storedName,
      mime: image.mime,
      source: image.source,
      originalObjectKey: image.original?.objectKey ?? null,
      originalBytes: image.original?.sizeBytes ?? null,
      originalExt: image.original?.ext ?? null,
      originalMime: image.original?.mime ?? null,
      originalWidth: image.original?.width ?? null,
      originalHeight: image.original?.height ?? null,
      thumbnailObjectKey: image.thumbnail?.objectKey ?? null,
      thumbnailBytes: image.thumbnail?.sizeBytes ?? null,
      thumbnailMime: image.thumbnail?.mime ?? null,
      thumbnailWidth: image.thumbnail?.width ?? null,
      thumbnailHeight: image.thumbnail?.height ?? null,
    })
}

/**
 * Lists album-scoped image rows with cursor pagination and optional query filtering.
 */
export async function listAlbumImages(
  _db: D1Database,
  input: ListAlbumImagesInput,
): Promise<ListAlbumImagesResult> {
  const db = getDb()
  const pageSize = normalizePageSize(input.pageSize)
  const sort = normalizeSort(input.sort)
  const query = normalizeQuery(input.query)
  const needle = query.toLowerCase()
  const cursor = input.cursor !== null && input.cursor !== undefined
    ? decodeImageListCursor(input.cursor)
    : null

  const conditions: SQL[] = [
    eq(imagesTable.albumId, input.albumId),
    isNull(imagesTable.deletedAt),
  ]
  if (needle.length > 0) {
    conditions.push(sql`instr(${imagesTable.nameLower}, ${needle}) > 0`)
  }
  if (cursor !== null) {
    conditions.push(sql`(
      ${imagesTable.createdAt} < ${cursor.createdAt}
      OR (${imagesTable.createdAt} = ${cursor.createdAt} AND ${imagesTable.id} < ${cursor.id})
    )`)
  }

  const rows = await db
    .select({
      id: imagesTable.id,
      albumId: imagesTable.albumId,
      name: imagesTable.name,
      nameLower: imagesTable.nameLower,
      ext: imagesTable.ext,
      bytes: imagesTable.bytes,
      width: imagesTable.width,
      height: imagesTable.height,
      createdAt: imagesTable.createdAt,
      updatedAt: imagesTable.updatedAt,
      originalName: imagesTable.originalName,
      storedName: imagesTable.storedName,
      mime: imagesTable.mime,
      source: imagesTable.source,
      originalBytes: imagesTable.originalBytes,
      originalObjectKey: imagesTable.originalObjectKey,
      originalExt: imagesTable.originalExt,
      originalMime: imagesTable.originalMime,
      originalWidth: imagesTable.originalWidth,
      originalHeight: imagesTable.originalHeight,
      thumbnailObjectKey: imagesTable.thumbnailObjectKey,
      thumbnailBytes: imagesTable.thumbnailBytes,
      thumbnailMime: imagesTable.thumbnailMime,
      thumbnailWidth: imagesTable.thumbnailWidth,
      thumbnailHeight: imagesTable.thumbnailHeight,
    })
    .from(imagesTable)
    .where(conditions.length > 1 ? and(...conditions) : conditions[0])
    .orderBy(desc(imagesTable.createdAt), desc(imagesTable.id))
    .limit(pageSize + 1)

  const hasNextPage = rows.length > pageSize
  const pageRows = hasNextPage ? rows.slice(0, pageSize) : rows
  const items = pageRows.map(row => toAlbumImageRecord(row))
  const lastRow = pageRows.at(-1)

  return {
    items,
    nextCursor: hasNextPage && lastRow !== undefined
      ? encodeImageListCursor({ createdAt: lastRow.createdAt, id: lastRow.id })
      : null,
    hasNextPage,
    pageSize,
    sort,
    query,
  }
}

/**
 * Deletes one image metadata row.
 */
export async function deleteImageRecords(_db: D1Database, image: ImageRecord): Promise<void> {
  const db = getDb()
  await db.delete(imagesTable).where(eq(imagesTable.id, image.objectKey))
}

/**
 * Hides an image before its R2 binary is deleted.
 *
 * The retained tombstone is the reconciliation record if R2 cleanup fails.
 *
 * @param _db D1 binding.
 * @param objectKey Canonical image object key.
 */
export async function markImageForDeletion(_db: D1Database, objectKey: string): Promise<void> {
  const db = getDb()
  await db
    .update(imagesTable)
    .set({
      deletedAt: Date.now(),
      cleanupError: null,
    })
    .where(and(eq(imagesTable.id, objectKey), isNull(imagesTable.deletedAt)))
}

/**
 * Records an R2 cleanup failure against an already-hidden image tombstone.
 *
 * @param _db D1 binding.
 * @param input Cleanup-failure details.
 * @param input.objectKey Canonical image object key.
 * @param input.message Error details retained for the next reconciliation attempt.
 */
export async function recordImageCleanupFailure(
  _db: D1Database,
  input: { objectKey: string, message: string },
): Promise<void> {
  const db = getDb()
  await db
    .update(imagesTable)
    .set({
      cleanupAttempts: sql`${imagesTable.cleanupAttempts} + 1`,
      cleanupError: input.message.slice(0, 500),
    })
    .where(and(eq(imagesTable.id, input.objectKey), isNotNull(imagesTable.deletedAt)))
}

/**
 * Lists hidden records whose R2 object deletion needs another attempt.
 *
 * @param _db D1 binding.
 * @param limit Maximum tombstones to process.
 * @returns Oldest pending image records first.
 */
export async function listImagesPendingDeletion(
  _db: D1Database,
  limit: number,
): Promise<ImageRecord[]> {
  const db = getDb()
  const rows = await db
    .select({
      id: imagesTable.id,
      albumId: imagesTable.albumId,
      name: imagesTable.name,
      nameLower: imagesTable.nameLower,
      ext: imagesTable.ext,
      bytes: imagesTable.bytes,
      width: imagesTable.width,
      height: imagesTable.height,
      createdAt: imagesTable.createdAt,
      updatedAt: imagesTable.updatedAt,
      originalName: imagesTable.originalName,
      storedName: imagesTable.storedName,
      mime: imagesTable.mime,
      source: imagesTable.source,
      deletedAt: imagesTable.deletedAt,
      cleanupAttempts: imagesTable.cleanupAttempts,
      cleanupError: imagesTable.cleanupError,
      originalObjectKey: imagesTable.originalObjectKey,
      originalBytes: imagesTable.originalBytes,
      originalExt: imagesTable.originalExt,
      originalMime: imagesTable.originalMime,
      originalWidth: imagesTable.originalWidth,
      originalHeight: imagesTable.originalHeight,
      thumbnailObjectKey: imagesTable.thumbnailObjectKey,
      thumbnailBytes: imagesTable.thumbnailBytes,
      thumbnailMime: imagesTable.thumbnailMime,
      thumbnailWidth: imagesTable.thumbnailWidth,
      thumbnailHeight: imagesTable.thumbnailHeight,
    })
    .from(imagesTable)
    .where(isNotNull(imagesTable.deletedAt))
    .orderBy(asc(imagesTable.deletedAt), asc(imagesTable.id))
    .limit(Math.max(1, Math.min(100, Math.trunc(limit))))

  return (rows as ImageRow[]).map(toImageRecord)
}

/**
 * Moves an image between albums.
 */
export async function moveImageRecords(
  _db: D1Database,
  input: { image: ImageRecord, targetAlbumId: string },
): Promise<ImageRecord> {
  const db = getDb()

  await db
    .update(imagesTable)
    .set({
      albumId: input.targetAlbumId,
      updatedAt: Date.now(),
    })
    .where(eq(imagesTable.id, input.image.objectKey))

  const moved = await getImageRecord(_db, input.image.objectKey)
  if (moved === null) {
    throw new Error('Image not found')
  }
  return moved
}

/**
 * Renames one image while preserving its object key and binary object.
 */
export async function renameImageRecords(
  _db: D1Database,
  input: { objectKey: string, name: string },
): Promise<ImageRecord> {
  const db = getDb()

  const trimmedName = input.name.trim()
  await db
    .update(imagesTable)
    .set({
      name: trimmedName,
      nameLower: trimmedName.toLowerCase(),
      updatedAt: Date.now(),
    })
    .where(eq(imagesTable.id, input.objectKey))

  const updated = await getImageRecord(_db, input.objectKey)
  if (updated === null) {
    throw new Error('Image not found')
  }

  return updated
}
