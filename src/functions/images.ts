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
import { getD1Binding, getR2Binding } from '@/lib/cloudflare/bindings'
import { buildPublicImageUrl, getR2PublicDomain } from '@/lib/cloudflare/publicUrl'
import { getDb } from '@/lib/db/client'
import { storageReservationsTable } from '@/lib/db/schema'
import {
  MAX_UPLOAD_ASSET_BYTES,
  validateOriginalUpload,
} from '@/lib/images/originalUploadValidation'
import { validateUploadImage } from '@/lib/images/uploadValidation'
import { albumExists } from '@/lib/storage/albumsRepo'
import { normalizeImageExt, normalizeImageMime, toStoredName } from '@/lib/storage/format'
import { deleteImageSafely, reconcilePendingImageDeletes } from '@/lib/storage/imageCleanup'
import { deriveDefaultImageName, resolveImageName } from '@/lib/storage/imageName'
import {
  getImageRecord,
  listAlbumImages,
  moveImageRecords,
  putImageRecords,
  renameImageRecords,
} from '@/lib/storage/imagesRepo'
import {
  buildOriginalR2ObjectKey,
  buildR2ObjectKey,
  buildThumbnailR2ObjectKey,
  putImageObject,
} from '@/lib/storage/r2Repo'
import {
  cleanupUncommittedUpload,
  getImageMetadataState,
  reconcilePendingUploads,
  releaseStorageReservation,
} from '@/lib/storage/uploadReconciliation'
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
  .validator(listImagesSchema)
  .handler(async ({ data }) => {
    await requireAuth()
    const db = getD1Binding()
    const r2 = getR2Binding()
    await reconcilePendingImageDeletes({ db, r2 }).catch((error) => {
      console.error('[listImagesFn] Failed to reconcile pending image deletions:', error)
    })
    await reconcilePendingUploads(r2).catch((error) => {
      console.error('[listImagesFn] Failed to reconcile pending uploads:', error)
    })
    if (!(await albumExists(db, data.albumId))) {
      throw new Error('Album not found')
    }

    const pagedImages = await listAlbumImages(db, {
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
        thumbnailUrl: publicDomain !== null
          ? buildPublicImageUrl(image.thumbnail?.objectKey ?? image.objectKey, publicDomain)
          : null,
      }
    })

    const payload: ListAlbumImagesResult & {
      items: AlbumImageListItem[]
      imageUrlError: string | null
    } = {
      ...pagedImages,
      items,
      imageUrlError,
    }

    return payload
  })

/**
 * Uploads one image object, writes metadata rows, and returns metadata.
 */
export const uploadImageFn = createServerFn({ method: 'POST' })
  .validator(validateUploadPayload)
  .handler(async ({ data }) => {
    await requireAuth()
    const db = getD1Binding()
    const r2 = getR2Binding()

    const albumId = String(data.get('albumId') ?? '').trim()
    uploadDashboardSchema.parse({ albumId })

    if (!(await albumExists(db, albumId))) {
      throw new Error('Album not found')
    }

    const fileEntry = data.get('file')
    if (!(fileEntry instanceof File)) {
      throw new TypeError('File is required')
    }

    const thumbnailEntry = data.get('thumbnail')
    if (!(thumbnailEntry instanceof File)) {
      throw new TypeError('WebP thumbnail is required')
    }

    const validatedFile = await validateUploadImage(fileEntry)
    const validatedThumbnail = await validateUploadImage(thumbnailEntry)
    if (validatedThumbnail.mime !== 'image/webp') {
      throw new Error('Thumbnail must be WebP')
    }
    if (validatedThumbnail.width > 512 || validatedThumbnail.height > 512) {
      throw new Error('Thumbnail dimensions must not exceed 512 pixels')
    }

    const originalEntry = data.get('original')
    const validatedOriginal = originalEntry instanceof File
      ? await validateOriginalUpload(originalEntry)
      : null
    const uploadAssetBytes = validatedFile.bytes.byteLength
      + validatedThumbnail.bytes.byteLength
      + (validatedOriginal?.file.size ?? 0)
    if (uploadAssetBytes > MAX_UPLOAD_ASSET_BYTES) {
      throw new Error('Combined hosted image, thumbnail, and original exceed 95 MiB')
    }
    const originalName = String(data.get('originalName') ?? fileEntry.name).trim() || fileEntry.name
    const source = sourceFrom(data.get('source'))
    const ext = normalizeImageExt(fileEntry.name, validatedFile.mime)
    const mime = normalizeImageMime(ext, validatedFile.mime)
    const storedName = toStoredName(originalName, ext)
    const objectKey = buildR2ObjectKey({ ext })
    const thumbnailObjectKey = buildThumbnailR2ObjectKey()
    const originalObjectKey = validatedOriginal === null
      ? null
      : buildOriginalR2ObjectKey({ ext: validatedOriginal.ext })
    const imageName = deriveDefaultImageName(originalName, objectKey)
    const uploadedAt = new Date().toISOString()
    const { bytes, width, height } = validatedFile

    const assetKeys = [objectKey, thumbnailObjectKey, ...(originalObjectKey === null ? [] : [originalObjectKey])]
    const bytesReserved = uploadAssetBytes

    await getDb().insert(storageReservationsTable).values({
      objectKey,
      bytesReserved,
      assetKeysJson: JSON.stringify(assetKeys),
      createdAt: Date.now(),
    })

    try {
      await putImageObject(r2, { key: objectKey, bytes, mime, albumId, source, uploadedAt })
      await putImageObject(r2, {
        key: thumbnailObjectKey,
        bytes: validatedThumbnail.bytes,
        mime: validatedThumbnail.mime,
        albumId,
        source,
        uploadedAt,
      })
      if (validatedOriginal !== null && originalObjectKey !== null) {
        await putImageObject(r2, {
          key: originalObjectKey,
          bytes: validatedOriginal.file.stream(),
          mime: validatedOriginal.mime,
          albumId,
          source,
          uploadedAt,
        })
      }
    }
    catch (error) {
      await cleanupUncommittedUpload(r2, objectKey, assetKeys, error)
      throw error
    }

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
      thumbnail: {
        objectKey: thumbnailObjectKey,
        sizeBytes: validatedThumbnail.bytes.byteLength,
        mime: 'image/webp',
        width: validatedThumbnail.width,
        height: validatedThumbnail.height,
      },
      original: validatedOriginal === null || originalObjectKey === null
        ? null
        : {
            objectKey: originalObjectKey,
            sizeBytes: validatedOriginal.file.size,
            ext: validatedOriginal.ext,
            mime: validatedOriginal.mime,
            width: null,
            height: null,
          },
    }

    const albumImage: AlbumImageRecord = {
      objectKey: image.objectKey,
      albumId,
      name: image.name,
      nameLower: image.name.toLowerCase(),
      storageBytes: image.sizeBytes + (image.thumbnail?.sizeBytes ?? 0) + (image.original?.sizeBytes ?? 0),
      sizeBytes: image.sizeBytes,
      mime: image.mime,
      width: image.width,
      height: image.height,
      createdAt: image.createdAt,
      thumbnail: image.thumbnail ?? null,
    }

    let metadataCommitted = false
    try {
      await putImageRecords(db, image, albumImage)
      metadataCommitted = true
    }
    catch (error) {
      const metadataState = await getImageMetadataState(image)
      if (metadataState === 'absent') {
        await cleanupUncommittedUpload(r2, objectKey, assetKeys, error)
      }
      if (metadataState !== 'present') {
        // An unavailable D1 response cannot prove the write rolled back. Keep
        // the reservation and let bounded reconciliation decide safely later.
        throw error
      }
      metadataCommitted = true
    }

    if (metadataCommitted) {
      // INSERT consumes the reservation in a trigger. The no-op delete also
      // handles a response that arrived after the trigger completed.
      await releaseStorageReservation(objectKey).catch((error) => {
        console.error('[uploadImageFn] Failed to release consumed storage reservation:', error)
      })
    }

    let publicUrl: string | null = null
    try {
      const publicDomain = getR2PublicDomain()
      publicUrl = buildPublicImageUrl(image.objectKey, publicDomain)
    }
    catch (error) {
      console.error('[uploadImageFn] Failed to resolve R2 public domain for uploaded image URL:', error)
    }

    return { image, albumImage, publicUrl }
  })

/**
 * Moves one image between albums.
 */
export const moveImageFn = createServerFn({ method: 'POST' })
  .validator(moveImageSchema)
  .handler(async ({ data }) => {
    await requireAuth()
    const db = getD1Binding()

    const image = await getImageRecord(db, data.objectKey)
    if (!image) {
      throw new Error('Image not found')
    }
    if (image.albumId === data.targetAlbumId) {
      return { image }
    }

    if (!(await albumExists(db, data.targetAlbumId))) {
      throw new Error('Target album not found')
    }

    const moved = await moveImageRecords(db, {
      image,
      targetAlbumId: data.targetAlbumId,
    })

    return { image: moved }
  })

/**
 * Moves multiple images between albums and reports success/failure counts.
 */
export const moveImagesFn = createServerFn({ method: 'POST' })
  .validator(moveImagesSchema)
  .handler(async ({ data }) => {
    await requireAuth()
    const db = getD1Binding()

    if (!(await albumExists(db, data.targetAlbumId))) {
      throw new Error('Target album not found')
    }

    const objectKeys = [...new Set(data.objectKeys)]
    const result = await runBulkOperation(objectKeys, async (objectKey) => {
      const image = await getImageRecord(db, objectKey)
      if (!image) {
        throw new Error('Image not found')
      }

      if (image.albumId !== data.targetAlbumId) {
        await moveImageRecords(db, {
          image,
          targetAlbumId: data.targetAlbumId,
        })
      }
    }, {
      concurrency: BULK_OPERATION_CONCURRENCY,
      timeoutMs: BULK_OPERATION_TIMEOUT_MS,
    })

    if (result.failed.length > 0) {
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
  .validator(renameImageSchema)
  .handler(async ({ data }) => {
    await requireAuth()
    const db = getD1Binding()
    const image = await renameImageRecords(db, {
      objectKey: data.objectKey,
      name: data.name,
    })
    return { image }
  })

/**
 * Deletes an image from R2 and metadata rows.
 */
export const deleteImageFn = createServerFn({ method: 'POST' })
  .validator(deleteImageSchema)
  .handler(async ({ data }) => {
    await requireAuth()
    const db = getD1Binding()
    const r2 = getR2Binding()
    const image = await getImageRecord(db, data.objectKey)
    if (!image) {
      throw new Error('Image not found')
    }

    return deleteImageSafely({ db, r2, image })
  })

/**
 * Deletes multiple images and reports success/failure counts.
 */
export const deleteImagesFn = createServerFn({ method: 'POST' })
  .validator(deleteImagesSchema)
  .handler(async ({ data }) => {
    await requireAuth()
    const db = getD1Binding()
    const r2 = getR2Binding()
    const objectKeys = [...new Set(data.objectKeys)]

    const result = await runBulkOperation(objectKeys, async (objectKey) => {
      const image = await getImageRecord(db, objectKey)
      if (!image) {
        throw new Error('Image not found')
      }

      return deleteImageSafely({ db, r2, image })
    }, {
      concurrency: BULK_OPERATION_CONCURRENCY,
      timeoutMs: BULK_OPERATION_TIMEOUT_MS,
    })

    if (result.failed.length > 0) {
      for (const failure of result.failed) {
        console.error(`[deleteImagesFn] Failed to delete image ${failure.item}:`, failure.error)
      }
    }

    return {
      total: objectKeys.length,
      succeeded: result.ok.length,
      failed: result.failed.length,
      succeededObjectKeys: result.ok.map(item => item.item),
      cleanupPendingObjectKeys: result.ok
        .filter(item => item.result.cleanupPending)
        .map(item => item.item),
      failedItems: result.failed.map(failure => ({
        objectKey: failure.item,
        reason: failure.error.message,
      })),
    }
  })
