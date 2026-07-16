import type { ImageSource, ThumbnailImageAsset } from '@/lib/storage/types'
import { and, asc, count, eq, gt, isNull } from 'drizzle-orm'
import { getDb } from '@/lib/db/client'
import { imagesTable } from '@/lib/db/schema'

const DEFAULT_PAGE_SIZE = 8
const MAX_PAGE_SIZE = 20

export interface MissingThumbnailCandidate {
  objectKey: string
  albumId: string
  storedName: string
  mime: string
  source: ImageSource
}

export interface MissingThumbnailPage {
  items: MissingThumbnailCandidate[]
  missingCount: number
  nextCursor: string | null
}

function normalizePageSize(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) {
    return DEFAULT_PAGE_SIZE
  }
  return Math.max(1, Math.min(MAX_PAGE_SIZE, Math.trunc(value)))
}

/** Lists active images whose dedicated album thumbnail has not been generated. */
export async function listMissingThumbnailCandidates(
  _db: D1Database,
  input: { cursor?: string | null, pageSize?: number },
): Promise<MissingThumbnailPage> {
  const db = getDb()
  const pageSize = normalizePageSize(input.pageSize)
  const conditions = [
    isNull(imagesTable.deletedAt),
    isNull(imagesTable.thumbnailObjectKey),
  ]
  if (input.cursor !== null && input.cursor !== undefined && input.cursor.length > 0) {
    conditions.push(gt(imagesTable.id, input.cursor))
  }

  const [[summary], rows] = await Promise.all([
    db
      .select({ value: count() })
      .from(imagesTable)
      .where(and(isNull(imagesTable.deletedAt), isNull(imagesTable.thumbnailObjectKey))),
    db
      .select({
        objectKey: imagesTable.id,
        albumId: imagesTable.albumId,
        storedName: imagesTable.storedName,
        mime: imagesTable.mime,
        source: imagesTable.source,
      })
      .from(imagesTable)
      .where(and(...conditions))
      .orderBy(asc(imagesTable.id))
      .limit(pageSize + 1),
  ])

  const hasNextPage = rows.length > pageSize
  const items = hasNextPage ? rows.slice(0, pageSize) : rows
  return {
    items,
    missingCount: summary?.value ?? 0,
    nextCursor: hasNextPage ? (items.at(-1)?.objectKey ?? null) : null,
  }
}

/** Returns the current thumbnail metadata for an active image. */
export async function getStoredThumbnail(
  _db: D1Database,
  objectKey: string,
): Promise<ThumbnailImageAsset | null | undefined> {
  const [row] = await getDb()
    .select({
      objectKey: imagesTable.thumbnailObjectKey,
      sizeBytes: imagesTable.thumbnailBytes,
      mime: imagesTable.thumbnailMime,
      width: imagesTable.thumbnailWidth,
      height: imagesTable.thumbnailHeight,
    })
    .from(imagesTable)
    .where(and(eq(imagesTable.id, objectKey), isNull(imagesTable.deletedAt)))
    .limit(1)

  if (row === undefined) {
    return undefined
  }
  if (row.objectKey === null) {
    return null
  }
  if (
    row.sizeBytes === null
    || row.mime !== 'image/webp'
    || row.width === null
    || row.height === null
  ) {
    throw new Error('Stored thumbnail metadata is incomplete')
  }
  return {
    objectKey: row.objectKey,
    sizeBytes: row.sizeBytes,
    mime: 'image/webp',
    width: row.width,
    height: row.height,
  }
}

/** Loads the R2 tracing metadata needed for a thumbnail write. */
export async function getThumbnailImageContext(
  _db: D1Database,
  objectKey: string,
): Promise<{ albumId: string, source: ImageSource } | undefined> {
  const [image] = await getDb()
    .select({ albumId: imagesTable.albumId, source: imagesTable.source })
    .from(imagesTable)
    .where(and(eq(imagesTable.id, objectKey), isNull(imagesTable.deletedAt)))
    .limit(1)
  return image
}

/** Atomically attaches a thumbnail only while the image remains unprocessed. */
export async function attachThumbnailIfMissing(
  _db: D1Database,
  input: { objectKey: string, thumbnail: ThumbnailImageAsset },
): Promise<boolean> {
  const rows = await getDb()
    .update(imagesTable)
    .set({
      thumbnailObjectKey: input.thumbnail.objectKey,
      thumbnailBytes: input.thumbnail.sizeBytes,
      thumbnailMime: input.thumbnail.mime,
      thumbnailWidth: input.thumbnail.width,
      thumbnailHeight: input.thumbnail.height,
      updatedAt: Date.now(),
    })
    .where(and(
      eq(imagesTable.id, input.objectKey),
      isNull(imagesTable.deletedAt),
      isNull(imagesTable.thumbnailObjectKey),
    ))
    .returning({ id: imagesTable.id })
  return rows.length === 1
}
