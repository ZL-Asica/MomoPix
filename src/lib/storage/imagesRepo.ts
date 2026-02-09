import type { AlbumImageRecord, ImageRecord } from '@/lib/storage/types'
import { deleteKey, getJson, listKeysWithPrefix, putJson } from '@/lib/cloudflare/kv'
import { resolveImageName } from '@/lib/storage/imageName'
import { albumImageKey, albumImagePrefixForAlbum, imageKey, STORAGE_KEYS } from '@/lib/storage/keys'

/**
 * Loads the canonical image metadata row.
 */
export async function getImageRecord(kv: KVNamespace, objectKey: string): Promise<ImageRecord | null> {
  return getJson<ImageRecord>(kv, imageKey(objectKey))
}

/**
 * Persists image metadata and its album index row.
 */
export async function putImageRecords(
  kv: KVNamespace,
  image: ImageRecord,
  albumImage: AlbumImageRecord,
): Promise<void> {
  await putJson(kv, imageKey(image.objectKey), image)
  await putJson(kv, albumImageKey(albumImage.albumId, albumImage.objectKey), albumImage)
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
  await deleteKey(kv, imageKey(image.objectKey))
  await deleteKey(kv, albumImageKey(image.albumId, image.objectKey))
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
    albumIndexKey: albumImageKey(input.targetAlbumId, input.image.objectKey),
  }
  const displayName = resolveImageName({
    name: updatedImage.name,
    objectKey: updatedImage.objectKey,
  })

  const nextIndex: AlbumImageRecord = {
    objectKey: updatedImage.objectKey,
    albumId: input.targetAlbumId,
    name: displayName,
    nameLower: displayName.toLowerCase(),
    sizeBytes: updatedImage.sizeBytes,
    mime: updatedImage.mime,
    width: updatedImage.width,
    height: updatedImage.height,
    createdAt: updatedImage.createdAt,
  }

  await deleteKey(kv, albumImageKey(input.image.albumId, input.image.objectKey))
  await putJson(kv, imageKey(updatedImage.objectKey), updatedImage)
  await putJson(kv, albumImageKey(nextIndex.albumId, nextIndex.objectKey), nextIndex)

  return updatedImage
}

/**
 * Renames one image while preserving its object key and binary object.
 *
 * This updates both the canonical image row and the album index row.
 */
export async function renameImageRecords(
  kv: KVNamespace,
  input: { objectKey: string, name: string },
): Promise<ImageRecord> {
  const image = await getImageRecord(kv, input.objectKey)
  if (!image) {
    throw new Error('Image not found')
  }

  const timestamp = new Date().toISOString()
  const nextName = input.name.trim()
  const updatedImage: ImageRecord = {
    ...image,
    name: nextName,
    updatedAt: timestamp,
  }

  const nextIndex: AlbumImageRecord = {
    objectKey: updatedImage.objectKey,
    albumId: updatedImage.albumId,
    name: nextName,
    nameLower: nextName.toLowerCase(),
    sizeBytes: updatedImage.sizeBytes,
    mime: updatedImage.mime,
    width: updatedImage.width,
    height: updatedImage.height,
    createdAt: updatedImage.createdAt,
  }

  await putJson(kv, imageKey(updatedImage.objectKey), updatedImage)
  await putJson(kv, albumImageKey(nextIndex.albumId, nextIndex.objectKey), nextIndex)

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
