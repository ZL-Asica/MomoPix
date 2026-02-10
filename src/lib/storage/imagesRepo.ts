import type { SQL } from 'drizzle-orm'
import type {
  AlbumImageRecord,
  ImageListSort,
  ImageRecord,
  ListAlbumImagesInput,
  ListAlbumImagesResult,
} from '@/lib/storage/types'
import { and, desc, eq, sql } from 'drizzle-orm'
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
    .where(eq(imagesTable.id, objectKey))
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

  const conditions: SQL[] = [eq(imagesTable.albumId, input.albumId)]
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
