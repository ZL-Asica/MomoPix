import type {
  AlbumImageRecord,
  ImageListSort,
  ImageRecord,
  ListAlbumImagesInput,
  ListAlbumImagesResult,
} from '@/lib/storage/types'
import { deleteKey, getJson, listKeysWithPrefix, putJson } from '@/lib/cloudflare/kv'
import { resolveImageName } from '@/lib/storage/imageName'
import {
  albumImageKey,
  albumImageKeyV2,
  albumImageMigrationKey,
  albumImagePrefixForAlbum,
  imageKey,
  parseAlbumImageIndexKey,
  STORAGE_KEYS,
} from '@/lib/storage/keys'

const DEFAULT_IMAGE_PAGE_SIZE = 50
const IMAGE_PAGE_SIZE_MIN = 10
const IMAGE_PAGE_SIZE_MAX = 200
const QUERY_SCAN_PAGE_SIZE = 100
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

function safeCursor(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function buildAlbumIndexCandidates(image: ImageRecord): string[] {
  const candidates = new Set<string>()
  if (image.albumIndexKey.trim().length > 0) {
    candidates.add(image.albumIndexKey)
  }
  candidates.add(albumImageKeyV2(image.albumId, image.createdAt, image.objectKey))
  candidates.add(albumImageKey(image.albumId, image.objectKey))
  return [...candidates]
}

async function migrateLegacyAlbumIndexKeys(kv: KVNamespace, albumId: string): Promise<void> {
  const migrationMarker = albumImageMigrationKey(albumId)
  if (await kv.get(migrationMarker) === '1') {
    return
  }

  const prefix = albumImagePrefixForAlbum(albumId)
  let cursor: string | undefined

  do {
    const page = await kv.list({ prefix, cursor })
    for (const key of page.keys) {
      const parsedKey = parseAlbumImageIndexKey(key.name, albumId)
      if (parsedKey === null || parsedKey.descTsToken !== null) {
        continue
      }

      const indexRow = await getJson<AlbumImageRecord>(kv, key.name)
      if (!indexRow) {
        await deleteKey(kv, key.name)
        continue
      }

      const nextIndexKey = albumImageKeyV2(albumId, indexRow.createdAt, indexRow.objectKey)
      if (nextIndexKey === key.name) {
        continue
      }

      await putJson(kv, nextIndexKey, indexRow)
      await deleteKey(kv, key.name)

      const image = await getImageRecord(kv, indexRow.objectKey)
      if (image === null || image.albumIndexKey === nextIndexKey) {
        continue
      }

      await putJson(kv, imageKey(image.objectKey), {
        ...image,
        albumIndexKey: nextIndexKey,
      })
    }

    cursor = page.list_complete ? undefined : page.cursor
  } while (cursor !== undefined)

  await kv.put(migrationMarker, '1')
}

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
  await putJson(kv, image.albumIndexKey, albumImage)
}

/**
 * Lists album-scoped image rows with cursor pagination and optional query filtering.
 */
export async function listAlbumImages(
  kv: KVNamespace,
  input: ListAlbumImagesInput,
): Promise<ListAlbumImagesResult> {
  const pageSize = normalizePageSize(input.pageSize)
  const sort = normalizeSort(input.sort)
  const query = normalizeQuery(input.query)
  const cursor = input.cursor ?? undefined

  await migrateLegacyAlbumIndexKeys(kv, input.albumId)

  const prefix = albumImagePrefixForAlbum(input.albumId)
  if (query.length === 0) {
    const page = await kv.list({
      prefix,
      cursor,
      limit: pageSize,
    })
    const pageCursor = page.list_complete ? undefined : safeCursor(page.cursor)
    const rows = await Promise.all(page.keys.map(async key => getJson<AlbumImageRecord>(kv, key.name)))
    const items = rows.filter((row): row is AlbumImageRecord => row !== null)

    return {
      items,
      nextCursor: page.list_complete ? null : pageCursor ?? null,
      hasNextPage: !page.list_complete,
      totalCount: null,
      pageSize,
      sort,
      query,
    }
  }

  const queryNeedle = query.toLowerCase()
  const items: AlbumImageRecord[] = []
  let nextCursor: string | null = null
  let hasNextPage = false
  let nextListCursor = cursor

  while (items.length < pageSize) {
    const page = await kv.list({
      prefix,
      cursor: nextListCursor,
      limit: Math.max(pageSize, QUERY_SCAN_PAGE_SIZE),
    })
    const pageCursor = page.list_complete ? undefined : safeCursor(page.cursor)
    const rows = await Promise.all(page.keys.map(async key => getJson<AlbumImageRecord>(kv, key.name)))
    for (const row of rows) {
      if (row === null) {
        continue
      }
      const haystack = row.nameLower || row.name.toLowerCase()
      if (!haystack.includes(queryNeedle)) {
        continue
      }
      items.push(row)
      if (items.length >= pageSize) {
        break
      }
    }

    if (items.length >= pageSize) {
      hasNextPage = !page.list_complete
      nextCursor = hasNextPage ? pageCursor ?? null : null
      break
    }
    if (page.list_complete) {
      hasNextPage = false
      nextCursor = null
      break
    }

    nextListCursor = pageCursor
  }

  return {
    items,
    nextCursor,
    hasNextPage,
    totalCount: null,
    pageSize,
    sort,
    query,
  }
}

/**
 * Deletes canonical and album-index rows for one image.
 */
export async function deleteImageRecords(kv: KVNamespace, image: ImageRecord): Promise<void> {
  await deleteKey(kv, imageKey(image.objectKey))
  for (const indexKey of buildAlbumIndexCandidates(image)) {
    await deleteKey(kv, indexKey)
  }
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
    albumIndexKey: albumImageKeyV2(input.targetAlbumId, input.image.createdAt, input.image.objectKey),
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

  for (const indexKey of buildAlbumIndexCandidates(input.image)) {
    await deleteKey(kv, indexKey)
  }
  await putJson(kv, imageKey(updatedImage.objectKey), updatedImage)
  await putJson(kv, updatedImage.albumIndexKey, nextIndex)

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
  const nextAlbumIndexKey = albumImageKeyV2(image.albumId, image.createdAt, image.objectKey)
  const updatedImage: ImageRecord = {
    ...image,
    name: nextName,
    updatedAt: timestamp,
    albumIndexKey: nextAlbumIndexKey,
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

  for (const indexKey of buildAlbumIndexCandidates(image)) {
    if (indexKey !== nextAlbumIndexKey) {
      await deleteKey(kv, indexKey)
    }
  }
  await putJson(kv, imageKey(updatedImage.objectKey), updatedImage)
  await putJson(kv, nextAlbumIndexKey, nextIndex)

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
