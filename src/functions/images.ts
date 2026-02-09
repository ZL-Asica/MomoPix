import type { AlbumImageListItem, AlbumImageRecord, ImageRecord, ImageSource } from '@/lib/storage/types'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/guards'
import { getKVBinding, getR2Binding } from '@/lib/cloudflare/bindings'
import { buildPublicImageUrl, getR2PublicDomain } from '@/lib/cloudflare/publicUrl'
import { getAlbumRecord } from '@/lib/storage/albumsRepo'
import { normalizeImageExt, normalizeImageMime, toStoredName } from '@/lib/storage/format'
import { deleteImageRecords, getImageRecord, listAlbumImages, moveImageRecords, putImageRecords } from '@/lib/storage/imagesRepo'
import { albumImageKey } from '@/lib/storage/keys'
import { buildR2ObjectKey, deleteImageObject, putImageObject } from '@/lib/storage/r2Repo'
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

    let imageUrlError: string | null = null
    let publicDomain: string | null = null
    try {
      publicDomain = getR2PublicDomain()
    }
    catch (error) {
      imageUrlError = error instanceof Error ? error.message : String(error)
      console.error('[listImagesFn] Failed to resolve R2 public domain for image URLs:', error)
    }

    const imagesWithUrl: AlbumImageListItem[] = images.map(image => ({
      ...image,
      publicUrl: publicDomain !== null ? buildPublicImageUrl(image.objectKey, publicDomain) : null,
    }))

    return { images: imagesWithUrl, imageUrlError }
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
    image.albumIndexKey = albumImageKey(albumId, image.objectKey)

    const albumImage: AlbumImageRecord = {
      objectKey: image.objectKey,
      albumId,
      name: image.storedName,
      nameLower: image.storedName.toLowerCase(),
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
