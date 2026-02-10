import type { AlbumRecord, ImageRecord, StorageMeta } from '@/lib/storage/types'
import { getJson, listKeysWithPrefix, putJson } from '@/lib/cloudflare/kv'
import { ensureStorageBootstrap, getAlbumRecord, getStorageMeta, putAlbumRecord, putStorageMeta, updateAlbumUsage } from '@/lib/storage/albumsRepo'
import { imageKey, STORAGE_KEYS } from '@/lib/storage/keys'

function nowISO(): string {
  return new Date().toISOString()
}

/**
 * Applies byte/image deltas to album and global usage counters.
 *
 * @param kv KV namespace binding.
 * @param input Usage delta payload.
 * @param input.albumId Album identifier.
 * @param input.deltaBytes Byte-count delta.
 * @param input.deltaCount Image-count delta.
 * @returns Updated album and global metadata records.
 */
export async function adjustUsage(
  kv: KVNamespace,
  input: { albumId: string, deltaBytes: number, deltaCount: number },
): Promise<{ album: AlbumRecord, meta: StorageMeta }> {
  await ensureStorageBootstrap(kv)
  const album = await updateAlbumUsage(kv, input)

  const meta = await getStorageMeta(kv)
  if (!meta) {
    throw new Error('Storage metadata is not initialized')
  }

  const updatedMeta: StorageMeta = {
    ...meta,
    totalBytesUsed: Math.max(0, meta.totalBytesUsed + input.deltaBytes),
    totalImageCount: Math.max(0, meta.totalImageCount + input.deltaCount),
    updatedAt: nowISO(),
  }

  await putStorageMeta(kv, updatedMeta)
  return { album, meta: updatedMeta }
}

/**
 * Marks storage metadata for a full recount after partial-failure scenarios.
 *
 * @param kv KV namespace binding.
 * @returns Resolves when metadata flag is updated.
 */
export async function markNeedsRecount(kv: KVNamespace): Promise<void> {
  await ensureStorageBootstrap(kv)
  const meta = await getStorageMeta(kv)
  if (!meta) {
    return
  }
  await putJson(kv, STORAGE_KEYS.meta, {
    ...meta,
    needsRecount: true,
    updatedAt: nowISO(),
  })
}

/**
 * Recomputes usage counters by scanning canonical image rows.
 *
 * @param kv KV namespace binding.
 * @returns Recounted storage metadata snapshot.
 */
export async function recountUsage(kv: KVNamespace): Promise<StorageMeta> {
  const { meta } = await ensureStorageBootstrap(kv)
  const albumKeys = await listKeysWithPrefix(kv, STORAGE_KEYS.albumPrefix)
  const albums = (await Promise.all(albumKeys.map(async (key) => {
    const albumId = key.slice(STORAGE_KEYS.albumPrefix.length)
    return getAlbumRecord(kv, albumId)
  }))).filter((item): item is AlbumRecord => item !== null)

  const albumById = new Map(albums.map(album => [album.id, album]))
  for (const album of albums) {
    album.bytesUsed = 0
    album.imageCount = 0
    album.updatedAt = nowISO()
  }

  let totalBytes = 0
  let totalImages = 0
  const imageKeys = await listKeysWithPrefix(kv, STORAGE_KEYS.imagePrefix)

  for (const key of imageKeys) {
    const image = await getJson<ImageRecord>(kv, key)
    if (!image) {
      continue
    }

    totalBytes += image.sizeBytes
    totalImages += 1

    const album = albumById.get(image.albumId)
    if (album) {
      album.bytesUsed += image.sizeBytes
      album.imageCount += 1
      album.updatedAt = nowISO()
    }
  }

  for (const album of albums) {
    await putAlbumRecord(kv, album)
  }

  const updatedMeta: StorageMeta = {
    ...meta,
    totalBytesUsed: totalBytes,
    totalImageCount: totalImages,
    needsRecount: false,
    updatedAt: nowISO(),
  }
  await putStorageMeta(kv, updatedMeta)

  return updatedMeta
}

/**
 * Checks whether a canonical image metadata row exists.
 *
 * @param kv KV namespace binding.
 * @param objectKey Canonical object key.
 * @returns `true` when the image metadata row exists.
 */
export async function hasImageRecord(kv: KVNamespace, objectKey: string): Promise<boolean> {
  const key = imageKey(objectKey)
  const raw = await kv.get(key)
  return raw !== null
}
