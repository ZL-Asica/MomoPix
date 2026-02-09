import type { AlbumImageRecord, ImageRecord, ImageSource } from '@/lib/storage/types'
import { createServerFn } from '@tanstack/react-start'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/guards'
import { getKVBinding, getR2Binding } from '@/lib/cloudflare/bindings'
import { getAlbumRecord } from '@/lib/storage/albumsRepo'
import { normalizeImageExt, normalizeImageMime, toStoredName } from '@/lib/storage/format'
import { deleteImageRecords, getImageRecord, listAlbumImages, moveImageRecords, putImageRecords } from '@/lib/storage/imagesRepo'
import { createR2ObjectKey, deleteImageObject, putImageObject } from '@/lib/storage/r2Repo'
import { adjustUsage, markNeedsRecount } from '@/lib/storage/usage'
import { deleteImageSchema, listImagesSchema, moveImageSchema } from '@/lib/storage/validators'

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
    const images = await listAlbumImages(kv, data.albumId)
    return { images }
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
    const imageId = nanoid(8)
    const uploadedAt = new Date().toISOString()
    const bytes = await fileEntry.arrayBuffer()
    const r2Key = createR2ObjectKey(imageId, ext)
    const width = parseNumberField(data.get('width'))
    const height = parseNumberField(data.get('height'))

    await putImageObject(r2, {
      key: r2Key,
      bytes,
      mime,
      imageId,
      albumId,
      source,
      uploadedAt,
    })

    const image: ImageRecord = {
      id: imageId,
      albumId,
      r2Key,
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
    image.albumIndexKey = `v1:u:single-user:album-image:${albumId}:${image.id}`

    const albumImage: AlbumImageRecord = {
      imageId: image.id,
      albumId,
      name: image.storedName,
      nameLower: image.storedName.toLowerCase(),
      sizeBytes: image.sizeBytes,
      mime: image.mime,
      width: image.width,
      height: image.height,
      createdAt: image.createdAt,
      r2Key: image.r2Key,
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
      await deleteImageObject(r2, r2Key).catch(() => {})
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

    const image = await getImageRecord(kv, data.imageId)
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
 * Deletes an image from R2 and metadata indexes.
 */
export const deleteImageFn = createServerFn({ method: 'POST' })
  .inputValidator(deleteImageSchema)
  .handler(async ({ data }) => {
    await requireAuth()
    const kv = getKVBinding()
    const r2 = getR2Binding()
    const image = await getImageRecord(kv, data.imageId)

    if (!image) {
      throw new Error('Image not found')
    }

    await deleteImageObject(r2, image.r2Key)

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
