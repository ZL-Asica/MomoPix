import type { AlbumImageRecord, ImageRecord } from '@/lib/storage/types'
import { deleteKey, getJson, listKeysWithPrefix, putJson } from '@/lib/cloudflare/kv'
import { albumImageKey, albumImagePrefixForAlbum, imageKey, STORAGE_KEYS } from '@/lib/storage/keys'

/**
 * Loads the canonical image metadata row.
 */
export async function getImageRecord(kv: KVNamespace, imageId: string): Promise<ImageRecord | null> {
  return getJson<ImageRecord>(kv, imageKey(imageId))
}

/**
 * Persists image metadata and its album index row.
 */
export async function putImageRecords(
  kv: KVNamespace,
  image: ImageRecord,
  albumImage: AlbumImageRecord,
): Promise<void> {
  await putJson(kv, imageKey(image.id), image)
  await putJson(kv, albumImageKey(albumImage.albumId, albumImage.imageId), albumImage)
}

/**
 * Lists album-scoped image rows sorted newest-first.
 */
export async function listAlbumImages(
  kv: KVNamespace,
  albumId: string,
): Promise<AlbumImageRecord[]> {
  const keys = await listKeysWithPrefix(kv, albumImagePrefixForAlbum(albumId))
  const rows = await Promise.all(keys.map(async key => getJson<AlbumImageRecord>(kv, key)))

  return rows
    .filter((row): row is AlbumImageRecord => row !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/**
 * Deletes canonical and album-index rows for one image.
 */
export async function deleteImageRecords(kv: KVNamespace, image: ImageRecord): Promise<void> {
  await deleteKey(kv, imageKey(image.id))
  await deleteKey(kv, albumImageKey(image.albumId, image.id))
}

/**
 * Moves an image between albums by rewriting metadata and index keys.
 */
export async function moveImageRecords(
  kv: KVNamespace,
  input: { image: ImageRecord, targetAlbumId: string },
): Promise<ImageRecord> {
  const timestamp = new Date().toISOString()

  const updatedImage: ImageRecord = {
    ...input.image,
    albumId: input.targetAlbumId,
    updatedAt: timestamp,
    albumIndexKey: albumImageKey(input.targetAlbumId, input.image.id),
  }

  const nextIndex: AlbumImageRecord = {
    imageId: updatedImage.id,
    albumId: input.targetAlbumId,
    name: updatedImage.storedName,
    nameLower: updatedImage.storedName.toLowerCase(),
    sizeBytes: updatedImage.sizeBytes,
    mime: updatedImage.mime,
    width: updatedImage.width,
    height: updatedImage.height,
    createdAt: updatedImage.createdAt,
    r2Key: updatedImage.r2Key,
  }

  await deleteKey(kv, albumImageKey(input.image.albumId, input.image.id))
  await putJson(kv, imageKey(updatedImage.id), updatedImage)
  await putJson(kv, albumImageKey(nextIndex.albumId, nextIndex.imageId), nextIndex)

  return updatedImage
}

/**
 * Lists all canonical image rows across albums.
 */
export async function listAllImageRecords(kv: KVNamespace): Promise<ImageRecord[]> {
  const keys = await listKeysWithPrefix(kv, STORAGE_KEYS.imagePrefix)
  const rows = await Promise.all(keys.map(async key => getJson<ImageRecord>(kv, key)))
  return rows.filter((row): row is ImageRecord => row !== null)
}
