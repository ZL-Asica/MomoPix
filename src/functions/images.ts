import type {
  AlbumImageListItem,
  AlbumImageRecord,
  ImageRecord,
  ImageSource,
  ListAlbumImagesResult,
} from '@/lib/storage/types'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/guards'
import { runBulkOperation } from '@/lib/bulk'
import { getKVBinding, getR2Binding } from '@/lib/cloudflare/bindings'
import { buildPublicImageUrl, getR2PublicDomain } from '@/lib/cloudflare/publicUrl'
import { getAlbumRecord } from '@/lib/storage/albumsRepo'
import { normalizeImageExt, normalizeImageMime, toStoredName } from '@/lib/storage/format'
import { deriveDefaultImageName, resolveImageName } from '@/lib/storage/imageName'
import { deleteImageRecords, getImageRecord, listAlbumImages, moveImageRecords, putImageRecords, renameImageRecords } from '@/lib/storage/imagesRepo'
import { albumImageKeyV2 } from '@/lib/storage/keys'
import { buildR2ObjectKey, deleteImageObject, putImageObject } from '@/lib/storage/r2Repo'
import { adjustUsage, markNeedsRecount } from '@/lib/storage/usage'
import {
  deleteImageSchema,
  deleteImagesSchema,
  listImagesSchema,
  moveImageSchema,
  moveImagesSchema,
  renameImageSchema,
} from '@/lib/storage/validators'

const BULK_OPERATION_CONCURRENCY = 4
const BULK_OPERATION_TIMEOUT_MS = 20_000

function parseNumberField(value: FormDataEntryValue | null): number | null {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null
  }
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return null
  }
  return parsed
}

function normalizeDimensionValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function sourceFrom(value: FormDataEntryValue | null): ImageSource {
  if (value === 'index-compressed') {
    return 'index-compressed'
  }
  return 'dashboard-upload'
}

function validateUploadPayload(input: unknown): FormData {
  if (input instanceof FormData) {
    return input
  }
  throw new Error('Invalid upload payload')
}

const uploadDashboardSchema = z.object({
  albumId: z.string().min(1),
})

/**
 * Lists indexed images for one album.
 */
export const listImagesFn = createServerFn({ method: 'POST' })
  .inputValidator(listImagesSchema)
  .handler(async ({ data }) => {
    await requireAuth()
    const kv = getKVBinding()
    const album = await getAlbumRecord(kv, data.albumId)
    if (!album) {
      throw new Error('Album not found')
    }
    const pagedImages = await listAlbumImages(kv, {
      albumId: data.albumId,
      cursor: data.cursor ?? null,
      pageSize: data.pageSize,
      sort: data.sort,
      query: data.query,
    })

    let imageUrlError: string | null = null
    let publicDomain: string | null = null
    try {
      publicDomain = getR2PublicDomain()
    }
    catch (error) {
      imageUrlError = error instanceof Error ? error.message : String(error)
      console.error('[listImagesFn] Failed to resolve R2 public domain for image URLs:', error)
    }

    const items: AlbumImageListItem[] = pagedImages.items.map((image) => {
      const name = resolveImageName({
        name: image.name,
        objectKey: image.objectKey,
      })
      return {
        ...image,
        name,
        nameLower: name.toLowerCase(),
        width: normalizeDimensionValue(image.width),
        height: normalizeDimensionValue(image.height),
        publicUrl: publicDomain !== null ? buildPublicImageUrl(image.objectKey, publicDomain) : null,
      }
    })

    const payload: ListAlbumImagesResult & {
      items: AlbumImageListItem[]
      imageUrlError: string | null
    } = {
      ...pagedImages,
      totalCount: pagedImages.query.length === 0 ? album.imageCount : null,
      items,
      imageUrlError,
    }

    return payload
  })

/**
 * Uploads one image object, writes metadata rows, and adjusts usage counters.
 */
export const uploadImageFn = createServerFn({ method: 'POST' })
  .inputValidator(validateUploadPayload)
  .handler(async ({ data }) => {
    await requireAuth()
    const kv = getKVBinding()
    const r2 = getR2Binding()

    const albumId = String(data.get('albumId') ?? '').trim()
    uploadDashboardSchema.parse({ albumId })

    const album = await getAlbumRecord(kv, albumId)
    if (!album) {
      throw new Error('Album not found')
    }

    const fileEntry = data.get('file')
    if (!(fileEntry instanceof File)) {
      throw new TypeError('File is required')
    }

    const originalName = String(data.get('originalName') ?? fileEntry.name).trim() || fileEntry.name
    const source = sourceFrom(data.get('source'))
    const ext = normalizeImageExt(fileEntry.name, fileEntry.type)
    const mime = normalizeImageMime(ext, fileEntry.type)
    const storedName = toStoredName(originalName, ext)
    const objectKey = buildR2ObjectKey({ ext })
    const imageName = deriveDefaultImageName(originalName, objectKey)
    const uploadedAt = new Date().toISOString()
    const bytes = await fileEntry.arrayBuffer()
    const width = parseNumberField(data.get('width'))
    const height = parseNumberField(data.get('height'))

    await putImageObject(r2, {
      key: objectKey,
      bytes,
      mime,
      albumId,
      source,
      uploadedAt,
    })

    const image: ImageRecord = {
      objectKey,
      albumId,
      name: imageName,
      originalName,
      storedName,
      ext,
      mime,
      sizeBytes: bytes.byteLength,
      width,
      height,
      createdAt: uploadedAt,
      updatedAt: uploadedAt,
      source,
      albumIndexKey: '',
    }
    image.albumIndexKey = albumImageKeyV2(albumId, image.createdAt, image.objectKey)

    const albumImage: AlbumImageRecord = {
      objectKey: image.objectKey,
      albumId,
      name: image.name,
      nameLower: image.name.toLowerCase(),
      sizeBytes: image.sizeBytes,
      mime: image.mime,
      width: image.width,
      height: image.height,
      createdAt: image.createdAt,
    }

    try {
      await putImageRecords(kv, image, albumImage)
      await adjustUsage(kv, {
        albumId,
        deltaBytes: image.sizeBytes,
        deltaCount: 1,
      })
    }
    catch (error) {
      await deleteImageObject(r2, objectKey).catch(() => {})
      await markNeedsRecount(kv).catch(() => {})
      throw error
    }

    return { image, albumImage }
  })

/**
 * Moves one image between albums and updates usage counters for both sides.
 */
export const moveImageFn = createServerFn({ method: 'POST' })
  .inputValidator(moveImageSchema)
  .handler(async ({ data }) => {
    await requireAuth()
    const kv = getKVBinding()

    const image = await getImageRecord(kv, data.objectKey)
    if (!image) {
      throw new Error('Image not found')
    }
    if (image.albumId === data.targetAlbumId) {
      return { image }
    }

    const targetAlbum = await getAlbumRecord(kv, data.targetAlbumId)
    if (!targetAlbum) {
      throw new Error('Target album not found')
    }

    try {
      const moved = await moveImageRecords(kv, {
        image,
        targetAlbumId: data.targetAlbumId,
      })
      await adjustUsage(kv, {
        albumId: image.albumId,
        deltaBytes: -image.sizeBytes,
        deltaCount: -1,
      })
      await adjustUsage(kv, {
        albumId: data.targetAlbumId,
        deltaBytes: image.sizeBytes,
        deltaCount: 1,
      })
      return { image: moved }
    }
    catch (error) {
      await markNeedsRecount(kv).catch(() => {})
      throw error
    }
  })

/**
 * Moves multiple images between albums and reports success/failure counts.
 */
export const moveImagesFn = createServerFn({ method: 'POST' })
  .inputValidator(moveImagesSchema)
  .handler(async ({ data }) => {
    await requireAuth()
    const kv = getKVBinding()

    const targetAlbum = await getAlbumRecord(kv, data.targetAlbumId)
    if (!targetAlbum) {
      throw new Error('Target album not found')
    }

    const objectKeys = [...new Set(data.objectKeys)]
    const result = await runBulkOperation(objectKeys, async (objectKey) => {
      const image = await getImageRecord(kv, objectKey)
      if (!image) {
        throw new Error('Image not found')
      }

      if (image.albumId !== data.targetAlbumId) {
        await moveImageRecords(kv, {
          image,
          targetAlbumId: data.targetAlbumId,
        })
        await adjustUsage(kv, {
          albumId: image.albumId,
          deltaBytes: -image.sizeBytes,
          deltaCount: -1,
        })
        await adjustUsage(kv, {
          albumId: data.targetAlbumId,
          deltaBytes: image.sizeBytes,
          deltaCount: 1,
        })
      }
    }, {
      concurrency: BULK_OPERATION_CONCURRENCY,
      timeoutMs: BULK_OPERATION_TIMEOUT_MS,
    })

    if (result.failed.length > 0) {
      await markNeedsRecount(kv).catch(() => {})
      for (const failure of result.failed) {
        console.error(`[moveImagesFn] Failed to move image ${failure.item}:`, failure.error)
      }
    }

    return {
      total: objectKeys.length,
      succeeded: result.ok.length,
      failed: result.failed.length,
      succeededObjectKeys: result.ok.map(item => item.item),
      failedItems: result.failed.map(failure => ({
        objectKey: failure.item,
        reason: failure.error.message,
      })),
    }
  })

/**
 * Renames one image metadata record without changing its object key.
 */
export const renameImageFn = createServerFn({ method: 'POST' })
  .inputValidator(renameImageSchema)
  .handler(async ({ data }) => {
    await requireAuth()
    const kv = getKVBinding()
    const image = await renameImageRecords(kv, {
      objectKey: data.objectKey,
      name: data.name,
    })
    return { image }
  })

/**
 * Deletes an image from R2 and metadata indexes.
 */
export const deleteImageFn = createServerFn({ method: 'POST' })
  .inputValidator(deleteImageSchema)
  .handler(async ({ data }) => {
    await requireAuth()
    const kv = getKVBinding()
    const r2 = getR2Binding()
    const image = await getImageRecord(kv, data.objectKey)

    if (!image) {
      throw new Error('Image not found')
    }

    await deleteImageObject(r2, image.objectKey)

    try {
      await deleteImageRecords(kv, image)
      await adjustUsage(kv, {
        albumId: image.albumId,
        deltaBytes: -image.sizeBytes,
        deltaCount: -1,
      })
      return true
    }
    catch (error) {
      await markNeedsRecount(kv).catch(() => {})
      throw error
    }
  })

/**
 * Deletes multiple images and reports success/failure counts.
 */
export const deleteImagesFn = createServerFn({ method: 'POST' })
  .inputValidator(deleteImagesSchema)
  .handler(async ({ data }) => {
    await requireAuth()
    const kv = getKVBinding()
    const r2 = getR2Binding()
    const objectKeys = [...new Set(data.objectKeys)]

    const result = await runBulkOperation(objectKeys, async (objectKey) => {
      const image = await getImageRecord(kv, objectKey)
      if (!image) {
        throw new Error('Image not found')
      }

      await deleteImageObject(r2, image.objectKey)
      await deleteImageRecords(kv, image)
      await adjustUsage(kv, {
        albumId: image.albumId,
        deltaBytes: -image.sizeBytes,
        deltaCount: -1,
      })
    }, {
      concurrency: BULK_OPERATION_CONCURRENCY,
      timeoutMs: BULK_OPERATION_TIMEOUT_MS,
    })

    if (result.failed.length > 0) {
      await markNeedsRecount(kv).catch(() => {})
      for (const failure of result.failed) {
        console.error(`[deleteImagesFn] Failed to delete image ${failure.item}:`, failure.error)
      }
    }

    return {
      total: objectKeys.length,
      succeeded: result.ok.length,
      failed: result.failed.length,
      succeededObjectKeys: result.ok.map(item => item.item),
      failedItems: result.failed.map(failure => ({
        objectKey: failure.item,
        reason: failure.error.message,
      })),
    }
  })
