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
}

function toImageRecord(row: ImageRow): ImageRecord {
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
  }
}

function toAlbumImageRecord(row: ImageRow): AlbumImageRecord {
  return {
    objectKey: row.id,
    albumId: row.albumId,
    name: row.name,
    nameLower: row.nameLower,
    sizeBytes: row.bytes,
    mime: row.mime,
    width: row.width,
    height: row.height,
    createdAt: toIsoString(row.createdAt),
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
    })
    .onConflictDoUpdate({
      target: imagesTable.id,
      set: {
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
        deletedAt: null,
        cleanupAttempts: 0,
        cleanupError: null,
      },
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
