import type { AlbumRecord, StorageBootstrapResult, StorageMeta } from '@/lib/storage/types'
import { nanoid } from 'nanoid'
import { getJson, listKeysWithPrefix, putJson } from '@/lib/cloudflare/kv'
import { albumKey, isRootAlbum, STORAGE_KEYS } from '@/lib/storage/keys'
import { ROOT_ALBUM_ID, STORAGE_SCHEMA_VERSION } from '@/lib/storage/types'

function nowISO(): string {
  return new Date().toISOString()
}

function createRootAlbum(timestamp: string): AlbumRecord {
  return {
    id: ROOT_ALBUM_ID,
    name: 'Default',
    parentId: null,
    path: [ROOT_ALBUM_ID],
    depth: 0,
    imageCount: 0,
    bytesUsed: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

function createDefaultMeta(timestamp: string): StorageMeta {
  return {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    rootAlbumId: ROOT_ALBUM_ID,
    defaultAlbumId: ROOT_ALBUM_ID,
    totalBytesUsed: 0,
    totalImageCount: 0,
    totalAlbumCount: 1,
    needsRecount: false,
    updatedAt: timestamp,
  }
}

/**
 * Reads global storage metadata.
 */
export async function getStorageMeta(kv: KVNamespace): Promise<StorageMeta | null> {
  return getJson<StorageMeta>(kv, STORAGE_KEYS.meta)
}

/**
 * Persists global storage metadata.
 */
export async function putStorageMeta(kv: KVNamespace, meta: StorageMeta): Promise<void> {
  await putJson(kv, STORAGE_KEYS.meta, meta)
}

/**
 * Updates storage metadata through an atomic read/modify/write callback.
 *
 * @throws {Error} When metadata has not been initialized.
 */
export async function updateStorageMeta(
  kv: KVNamespace,
  updater: (meta: StorageMeta) => StorageMeta,
): Promise<StorageMeta> {
  const meta = await getStorageMeta(kv)
  if (!meta) {
    throw new Error('Storage metadata is not initialized')
  }
  const updated = updater(meta)
  await putStorageMeta(kv, updated)
  return updated
}

/**
 * Loads an album record by id.
 */
export async function getAlbumRecord(kv: KVNamespace, albumId: string): Promise<AlbumRecord | null> {
  return getJson<AlbumRecord>(kv, albumKey(albumId))
}

/**
 * Writes one album record.
 */
export async function putAlbumRecord(kv: KVNamespace, album: AlbumRecord): Promise<void> {
  await putJson(kv, albumKey(album.id), album)
}

/**
 * Lists all albums sorted by depth then name for stable tree rendering.
 */
export async function listAlbumRecords(kv: KVNamespace): Promise<AlbumRecord[]> {
  const keys = await listKeysWithPrefix(kv, STORAGE_KEYS.albumPrefix)
  const rows = await Promise.all(keys.map(async key => getJson<AlbumRecord>(kv, key)))

  return rows
    .filter((row): row is AlbumRecord => row !== null)
    .sort((a, b) => {
      if (a.depth !== b.depth) {
        return a.depth - b.depth
      }
      return a.name.localeCompare(b.name)
    })
}

/**
 * Ensures the root album and metadata records exist.
 */
export async function ensureStorageBootstrap(kv: KVNamespace): Promise<StorageBootstrapResult> {
  const timestamp = nowISO()
  let meta = await getStorageMeta(kv)
  let rootAlbum = await getAlbumRecord(kv, ROOT_ALBUM_ID)

  if (!meta) {
    meta = createDefaultMeta(timestamp)
    await putStorageMeta(kv, meta)
  }

  if (!rootAlbum) {
    rootAlbum = createRootAlbum(timestamp)
    await putAlbumRecord(kv, rootAlbum)
  }
  else if (rootAlbum.name !== 'Default') {
    // Lazy, backward-compatible migration from older "Root" label.
    rootAlbum = {
      ...rootAlbum,
      name: 'Default',
      updatedAt: timestamp,
    }
    await putAlbumRecord(kv, rootAlbum)
  }

  return { meta, rootAlbum }
}

/**
 * Creates a child album under `parentId`.
 *
 * @throws {Error} When parent album does not exist.
 */
export async function createAlbumRecord(
  kv: KVNamespace,
  input: { name: string, parentId: string | null },
): Promise<AlbumRecord> {
  await ensureStorageBootstrap(kv)

  const timestamp = nowISO()
  const albumId = `alb_${nanoid(8)}`
  const parentAlbum = input.parentId === null ? null : await getAlbumRecord(kv, input.parentId)
  if (input.parentId !== null && !parentAlbum) {
    throw new Error('Parent album does not exist')
  }

  const path = parentAlbum ? [...parentAlbum.path, albumId] : [albumId]
  const depth = path.length - 1

  const album: AlbumRecord = {
    id: albumId,
    name: input.name.trim(),
    parentId: parentAlbum?.id ?? null,
    path,
    depth,
    imageCount: 0,
    bytesUsed: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await putAlbumRecord(kv, album)
  await updateStorageMeta(kv, meta => ({
    ...meta,
    totalAlbumCount: meta.totalAlbumCount + 1,
    updatedAt: timestamp,
  }))

  return album
}

/**
 * Renames an existing album.
 *
 * @throws {Error} When album does not exist.
 */
export async function renameAlbumRecord(
  kv: KVNamespace,
  input: { albumId: string, name: string },
): Promise<AlbumRecord> {
  await ensureStorageBootstrap(kv)
  const album = await getAlbumRecord(kv, input.albumId)
  if (!album) {
    throw new Error('Album not found')
  }

  const updated: AlbumRecord = {
    ...album,
    name: input.name.trim(),
    updatedAt: nowISO(),
  }

  await putAlbumRecord(kv, updated)
  return updated
}

/**
 * Sets the default destination album for uploads.
 *
 * @throws {Error} When album does not exist.
 */
export async function setDefaultAlbum(
  kv: KVNamespace,
  input: { albumId: string },
): Promise<StorageMeta> {
  await ensureStorageBootstrap(kv)
  const album = await getAlbumRecord(kv, input.albumId)
  if (!album) {
    throw new Error('Album not found')
  }

  return updateStorageMeta(kv, meta => ({
    ...meta,
    defaultAlbumId: input.albumId,
    updatedAt: nowISO(),
  }))
}

/**
 * Moves an album and rewrites descendant `path`/`depth` values.
 *
 * @throws {Error} For root/self/descendant-invalid move attempts.
 */
export async function moveAlbumRecord(
  kv: KVNamespace,
  input: { albumId: string, parentId: string | null },
): Promise<AlbumRecord> {
  await ensureStorageBootstrap(kv)
  if (isRootAlbum(input.albumId)) {
    throw new Error('Root album cannot be moved')
  }
  if (input.parentId !== null && input.albumId === input.parentId) {
    throw new Error('An album cannot be moved into itself')
  }

  const albums = await listAlbumRecords(kv)
  const albumById = new Map(albums.map(album => [album.id, album]))

  const sourceAlbum = albumById.get(input.albumId)
  if (!sourceAlbum) {
    throw new Error('Album not found')
  }

  const targetParent = input.parentId === null ? null : albumById.get(input.parentId)
  if (input.parentId !== null && !targetParent) {
    throw new Error('Target parent album not found')
  }

  if (targetParent && targetParent.path.includes(sourceAlbum.id)) {
    throw new Error('Cannot move an album into one of its descendants')
  }

  const oldPath = sourceAlbum.path
  const newPath = targetParent ? [...targetParent.path, sourceAlbum.id] : [sourceAlbum.id]
  const timestamp = nowISO()

  const descendants = albums.filter((album) => {
    if (album.path.length < oldPath.length) {
      return false
    }
    for (let i = 0; i < oldPath.length; i += 1) {
      if (album.path[i] !== oldPath[i]) {
        return false
      }
    }
    return true
  })

  for (const album of descendants) {
    const suffix = album.path.slice(oldPath.length)
    const updated: AlbumRecord = {
      ...album,
      path: [...newPath, ...suffix],
      depth: newPath.length + suffix.length - 1,
      parentId: album.id === sourceAlbum.id ? targetParent?.id ?? null : album.parentId,
      updatedAt: timestamp,
    }
    await putAlbumRecord(kv, updated)
  }

  await updateStorageMeta(kv, meta => ({ ...meta, updatedAt: timestamp }))

  const moved = await getAlbumRecord(kv, sourceAlbum.id)
  if (!moved) {
    throw new Error('Failed to fetch moved album')
  }
  return moved
}

/**
 * Applies usage counter deltas to a specific album.
 */
export async function updateAlbumUsage(
  kv: KVNamespace,
  input: { albumId: string, deltaBytes: number, deltaCount: number },
): Promise<AlbumRecord> {
  const album = await getAlbumRecord(kv, input.albumId)
  if (!album) {
    throw new Error('Album not found')
  }

  const updated: AlbumRecord = {
    ...album,
    bytesUsed: Math.max(0, album.bytesUsed + input.deltaBytes),
    imageCount: Math.max(0, album.imageCount + input.deltaCount),
    updatedAt: nowISO(),
  }

  await putAlbumRecord(kv, updated)
  return updated
}
