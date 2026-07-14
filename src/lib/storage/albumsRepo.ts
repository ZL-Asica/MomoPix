import type { AlbumRecord, StorageBootstrapResult, StorageMeta } from '@/lib/storage/types'
import { eq, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { getDb } from '@/lib/db/client'
import { albumsTable, imagesTable } from '@/lib/db/schema'
import { ROOT_ALBUM_ID } from '@/lib/storage/types'

function nowMs(): number {
  return Date.now()
}

function toIsoString(value: number): string {
  return new Date(value).toISOString()
}

interface AlbumUsageRow {
  albumId: string
  imageCount: number
  bytesUsed: number
}

async function loadAlbumUsageById(): Promise<Map<string, { imageCount: number, bytesUsed: number }>> {
  const db = getDb()
  const rows = await db
    .select({
      albumId: imagesTable.albumId,
      imageCount: sql<number>`CAST(COUNT(*) AS INTEGER)`,
      bytesUsed: sql<number>`COALESCE(SUM(${imagesTable.bytes}), 0)`,
    })
    .from(imagesTable)
    .groupBy(imagesTable.albumId)

  const usageById = new Map<string, { imageCount: number, bytesUsed: number }>()
  for (const row of rows as AlbumUsageRow[]) {
    usageById.set(row.albumId, {
      imageCount: Math.max(0, row.imageCount),
      bytesUsed: Math.max(0, row.bytesUsed),
    })
  }
  return usageById
}

async function loadAlbumRows() {
  const db = getDb()
  return db
    .select({
      id: albumsTable.id,
      name: albumsTable.name,
      parentId: albumsTable.parentId,
      createdAt: albumsTable.createdAt,
      updatedAt: albumsTable.updatedAt,
    })
    .from(albumsTable)
}

function buildPathResolver(rows: Array<{ id: string, parentId: string | null }>) {
  const byId = new Map(rows.map(row => [row.id, row]))
  const cache = new Map<string, string[]>()

  const resolvePath = (albumId: string, trail: Set<string> = new Set()): string[] => {
    const cached = cache.get(albumId)
    if (cached) {
      return cached
    }

    const row = byId.get(albumId)
    if (row === undefined) {
      const fallback = [albumId]
      cache.set(albumId, fallback)
      return fallback
    }

    if (row.parentId === null || !byId.has(row.parentId)) {
      const rootPath = [albumId]
      cache.set(albumId, rootPath)
      return rootPath
    }

    if (trail.has(albumId)) {
      const cycleFallback = [albumId]
      cache.set(albumId, cycleFallback)
      return cycleFallback
    }

    const nextTrail = new Set(trail)
    nextTrail.add(albumId)
    const parentPath = resolvePath(row.parentId, nextTrail)
    const path = [...parentPath, albumId]
    cache.set(albumId, path)
    return path
  }

  return resolvePath
}

async function listAlbumRecordsInternal(): Promise<AlbumRecord[]> {
  const [rows, usageById] = await Promise.all([
    loadAlbumRows(),
    loadAlbumUsageById(),
  ])
  const resolvePath = buildPathResolver(rows.map(row => ({ id: row.id, parentId: row.parentId })))

  return rows
    .map((row) => {
      const usage = usageById.get(row.id)
      const path = resolvePath(row.id)
      return {
        id: row.id,
        name: row.name,
        parentId: row.parentId,
        path,
        depth: Math.max(0, path.length - 1),
        imageCount: usage?.imageCount ?? 0,
        bytesUsed: usage?.bytesUsed ?? 0,
        createdAt: toIsoString(row.createdAt),
        updatedAt: toIsoString(row.updatedAt),
      } satisfies AlbumRecord
    })
    .sort((a, b) => {
      if (a.depth !== b.depth) {
        return a.depth - b.depth
      }
      return a.name.localeCompare(b.name)
    })
}

async function getAlbumRecordInternal(albumId: string): Promise<AlbumRecord | null> {
  const albums = await listAlbumRecordsInternal()
  return albums.find(album => album.id === albumId) ?? null
}

async function buildStorageMetaInternal(): Promise<StorageMeta> {
  const db = getDb()
  const [defaultAlbum] = await db
    .select({ id: albumsTable.id })
    .from(albumsTable)
    .where(eq(albumsTable.isDefault, 1))
    .limit(1)

  const [albumTotals] = await db
    .select({
      totalAlbumCount: sql<number>`CAST(COUNT(*) AS INTEGER)`,
      maxUpdatedAt: sql<number>`COALESCE(MAX(${albumsTable.updatedAt}), 0)`,
    })
    .from(albumsTable)

  const [imageTotals] = await db
    .select({
      totalImageCount: sql<number>`CAST(COUNT(*) AS INTEGER)`,
      totalBytesUsed: sql<number>`COALESCE(SUM(${imagesTable.bytes}), 0)`,
      maxUpdatedAt: sql<number>`COALESCE(MAX(${imagesTable.updatedAt}), 0)`,
    })
    .from(imagesTable)

  const updatedAtMs = Math.max(
    albumTotals?.maxUpdatedAt ?? 0,
    imageTotals?.maxUpdatedAt ?? 0,
    0,
  )

  return {
    rootAlbumId: ROOT_ALBUM_ID,
    defaultAlbumId: defaultAlbum?.id ?? ROOT_ALBUM_ID,
    totalBytesUsed: imageTotals?.totalBytesUsed ?? 0,
    totalImageCount: imageTotals?.totalImageCount ?? 0,
    totalAlbumCount: albumTotals?.totalAlbumCount ?? 0,
    updatedAt: toIsoString(updatedAtMs > 0 ? updatedAtMs : nowMs()),
  }
}

async function ensureRootAlbum(): Promise<void> {
  const db = getDb()
  const [rootAlbum] = await db
    .select({ id: albumsTable.id, name: albumsTable.name })
    .from(albumsTable)
    .where(eq(albumsTable.id, ROOT_ALBUM_ID))
    .limit(1)

  const timestamp = nowMs()
  if (rootAlbum === undefined) {
    await db.insert(albumsTable).values({
      id: ROOT_ALBUM_ID,
      name: 'Default',
      parentId: null,
      isDefault: 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    return
  }

  if (rootAlbum.name !== 'Default') {
    await db
      .update(albumsTable)
      .set({
        name: 'Default',
        updatedAt: timestamp,
      })
      .where(eq(albumsTable.id, ROOT_ALBUM_ID))
  }
}

async function ensureDefaultAlbum(): Promise<void> {
  const db = getDb()
  const [defaultAlbum] = await db
    .select({ id: albumsTable.id })
    .from(albumsTable)
    .where(eq(albumsTable.isDefault, 1))
    .limit(1)

  if (defaultAlbum !== undefined) {
    return
  }

  await db
    .update(albumsTable)
    .set({
      isDefault: 1,
      updatedAt: nowMs(),
    })
    .where(eq(albumsTable.id, ROOT_ALBUM_ID))
}

/**
 * Reads global storage metadata.
 *
 * @param _db D1 database binding.
 * @returns Storage metadata snapshot.
 */
export async function getStorageMeta(_db: D1Database): Promise<StorageMeta | null> {
  await ensureStorageBootstrap(_db)
  return buildStorageMetaInternal()
}

/**
 * Loads an album record by id.
 *
 * @param _db D1 database binding.
 * @param albumId Album identifier.
 * @returns Album row or `null` when not found.
 */
export async function getAlbumRecord(_db: D1Database, albumId: string): Promise<AlbumRecord | null> {
  await ensureStorageBootstrap(_db)
  return getAlbumRecordInternal(albumId)
}

/**
 * Checks whether an album exists without loading the complete album tree or
 * aggregating image usage.
 *
 * @param _db D1 database binding.
 * @param albumId Album identifier.
 * @returns `true` when the album exists.
 */
export async function albumExists(_db: D1Database, albumId: string): Promise<boolean> {
  const db = getDb()
  const [album] = await db
    .select({ id: albumsTable.id })
    .from(albumsTable)
    .where(eq(albumsTable.id, albumId))
    .limit(1)

  if (album !== undefined || albumId !== ROOT_ALBUM_ID) {
    return album !== undefined
  }

  // Direct image endpoints can be the first storage request. Initialize only
  // the root row on that uncommon path instead of rebuilding usage metadata.
  await ensureRootAlbum()
  return true
}

/**
 * Lists all albums sorted by depth then name for stable tree rendering.
 *
 * @param _db D1 database binding.
 * @returns Sorted flat album list.
 *
 * The caller must initialize storage with `ensureStorageBootstrap` before
 * listing. Server handlers already perform that initialization once per
 * request, avoiding duplicate D1 reads for the same snapshot.
 */
export async function listAlbumRecords(_db: D1Database): Promise<AlbumRecord[]> {
  return listAlbumRecordsInternal()
}

/**
 * Ensures the root/default album state exists.
 *
 * @param _db D1 database binding.
 * @returns Current metadata and root-album records.
 */
export async function ensureStorageBootstrap(_db: D1Database): Promise<StorageBootstrapResult> {
  await ensureRootAlbum()
  await ensureDefaultAlbum()

  const [meta, rootAlbum] = await Promise.all([
    buildStorageMetaInternal(),
    getAlbumRecordInternal(ROOT_ALBUM_ID),
  ])

  if (rootAlbum === null) {
    throw new Error('Failed to initialize root album')
  }

  return { meta, rootAlbum }
}

/**
 * Creates a child album under `parentId`.
 *
 * @param _db D1 database binding.
 * @param input Album creation payload.
 * @param input.name Album display name.
 * @param input.parentId Parent album id or null.
 * @returns Created album record.
 */
export async function createAlbumRecord(
  _db: D1Database,
  input: { name: string, parentId: string | null },
): Promise<AlbumRecord> {
  await ensureStorageBootstrap(_db)

  const db = getDb()
  const parentId = input.parentId
  if (parentId !== null) {
    const [parentAlbum] = await db
      .select({ id: albumsTable.id })
      .from(albumsTable)
      .where(eq(albumsTable.id, parentId))
      .limit(1)

    if (parentAlbum === undefined) {
      throw new Error('Parent album does not exist')
    }
  }

  const timestamp = nowMs()
  const albumId = `alb_${nanoid(8)}`
  await db.insert(albumsTable).values({
    id: albumId,
    name: input.name.trim(),
    parentId,
    isDefault: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  })

  const album = await getAlbumRecordInternal(albumId)
  if (album === null) {
    throw new Error('Failed to create album')
  }
  return album
}

/**
 * Renames an existing album.
 *
 * @param _db D1 database binding.
 * @param input Album id and next name.
 * @param input.albumId Album identifier.
 * @param input.name Next album display name.
 * @returns Renamed album record.
 */
export async function renameAlbumRecord(
  _db: D1Database,
  input: { albumId: string, name: string },
): Promise<AlbumRecord> {
  await ensureStorageBootstrap(_db)
  const db = getDb()

  const [existing] = await db
    .select({ id: albumsTable.id })
    .from(albumsTable)
    .where(eq(albumsTable.id, input.albumId))
    .limit(1)

  if (existing === undefined) {
    throw new Error('Album not found')
  }

  await db
    .update(albumsTable)
    .set({
      name: input.name.trim(),
      updatedAt: nowMs(),
    })
    .where(eq(albumsTable.id, input.albumId))

  const album = await getAlbumRecordInternal(input.albumId)
  if (album === null) {
    throw new Error('Failed to fetch renamed album')
  }
  return album
}

/**
 * Sets the default destination album for uploads.
 *
 * @param _db D1 database binding.
 * @param input Album id to set as default.
 * @param input.albumId Album identifier.
 * @returns Updated storage metadata.
 */
export async function setDefaultAlbum(
  _db: D1Database,
  input: { albumId: string },
): Promise<StorageMeta> {
  await ensureStorageBootstrap(_db)
  const db = getDb()

  const [target] = await db
    .select({ id: albumsTable.id })
    .from(albumsTable)
    .where(eq(albumsTable.id, input.albumId))
    .limit(1)

  if (target === undefined) {
    throw new Error('Album not found')
  }

  const timestamp = nowMs()
  await db
    .update(albumsTable)
    .set({
      isDefault: 0,
      updatedAt: timestamp,
    })
    .where(eq(albumsTable.isDefault, 1))

  await db
    .update(albumsTable)
    .set({
      isDefault: 1,
      updatedAt: timestamp,
    })
    .where(eq(albumsTable.id, input.albumId))

  return buildStorageMetaInternal()
}

/**
 * Moves an album by changing its parent id.
 *
 * @param _db D1 database binding.
 * @param input Source album id and target parent id.
 * @param input.albumId Source album identifier.
 * @param input.parentId Target parent album identifier or null.
 * @returns Moved album record.
 */
export async function moveAlbumRecord(
  _db: D1Database,
  input: { albumId: string, parentId: string | null },
): Promise<AlbumRecord> {
  await ensureStorageBootstrap(_db)

  if (input.albumId === ROOT_ALBUM_ID) {
    throw new Error('Root album cannot be moved')
  }
  if (input.parentId !== null && input.parentId === input.albumId) {
    throw new Error('An album cannot be moved into itself')
  }

  const db = getDb()
  const albums = await db
    .select({
      id: albumsTable.id,
      parentId: albumsTable.parentId,
    })
    .from(albumsTable)

  const byId = new Map(albums.map(album => [album.id, album]))
  const source = byId.get(input.albumId)
  if (source === undefined) {
    throw new Error('Album not found')
  }

  if (input.parentId !== null && !byId.has(input.parentId)) {
    throw new Error('Target parent album not found')
  }

  let ancestorId = input.parentId
  while (ancestorId !== null) {
    if (ancestorId === input.albumId) {
      throw new Error('Cannot move an album into one of its descendants')
    }

    const ancestor = byId.get(ancestorId)
    ancestorId = ancestor?.parentId ?? null
  }

  await db
    .update(albumsTable)
    .set({
      parentId: input.parentId,
      updatedAt: nowMs(),
    })
    .where(eq(albumsTable.id, input.albumId))

  const moved = await getAlbumRecordInternal(input.albumId)
  if (moved === null) {
    throw new Error('Failed to fetch moved album')
  }

  return moved
}
