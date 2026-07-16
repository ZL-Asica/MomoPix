import type { ThumbnailImageAsset } from '@/lib/storage/types'
import { getDb } from '@/lib/db/client'
import { storageReservationsTable } from '@/lib/db/schema'
import { buildThumbnailR2ObjectKey, putImageObject } from '@/lib/storage/r2Repo'
import {
  attachThumbnailIfMissing,
  getStoredThumbnail,
  getThumbnailImageContext,
} from '@/lib/storage/thumbnailMaintenanceRepo'
import {
  cleanupUncommittedUpload,
  releaseStorageReservation,
} from '@/lib/storage/uploadReconciliation'

/**
 * Persists one browser-generated WebP thumbnail with quota reservation and
 * failure-safe R2 cleanup.
 */
export async function persistMissingThumbnail(input: {
  db: D1Database
  r2: R2Bucket
  objectKey: string
  bytes: ArrayBuffer
  width: number
  height: number
}): Promise<{ thumbnail: ThumbnailImageAsset, alreadyPresent: boolean }> {
  const current = await getStoredThumbnail(input.db, input.objectKey)
  if (current === undefined) {
    throw new Error('Image not found')
  }
  if (current !== null) {
    return { thumbnail: current, alreadyPresent: true }
  }

  const image = await getThumbnailImageContext(input.db, input.objectKey)
  if (image === undefined) {
    throw new Error('Image not found')
  }

  const thumbnail: ThumbnailImageAsset = {
    objectKey: buildThumbnailR2ObjectKey(),
    sizeBytes: input.bytes.byteLength,
    mime: 'image/webp',
    width: input.width,
    height: input.height,
  }
  const uploadedAt = new Date().toISOString()

  await getDb().insert(storageReservationsTable).values({
    objectKey: thumbnail.objectKey,
    bytesReserved: thumbnail.sizeBytes,
    assetKeysJson: JSON.stringify([thumbnail.objectKey]),
    createdAt: Date.now(),
  })

  try {
    await putImageObject(input.r2, {
      key: thumbnail.objectKey,
      bytes: input.bytes,
      mime: thumbnail.mime,
      albumId: image.albumId,
      source: image.source,
      uploadedAt,
    })
  }
  catch (error) {
    await cleanupUncommittedUpload(
      input.r2,
      thumbnail.objectKey,
      [thumbnail.objectKey],
      error,
    )
    throw error
  }

  try {
    if (await attachThumbnailIfMissing(input.db, { objectKey: input.objectKey, thumbnail })) {
      return { thumbnail, alreadyPresent: false }
    }

    const stored = await getStoredThumbnail(input.db, input.objectKey)
    await cleanupUncommittedUpload(
      input.r2,
      thumbnail.objectKey,
      [thumbnail.objectKey],
      new Error('Thumbnail was attached by another request'),
    )
    if (stored === undefined) {
      throw new Error('Image not found')
    }
    if (stored === null) {
      throw new Error('Thumbnail metadata was not saved')
    }
    return { thumbnail: stored, alreadyPresent: true }
  }
  catch (error) {
    let stored: ThumbnailImageAsset | null | undefined
    try {
      stored = await getStoredThumbnail(input.db, input.objectKey)
    }
    catch (stateError) {
      // A lost D1 response cannot prove that the UPDATE rolled back. Retain
      // both the object and its reservation for bounded reconciliation.
      console.error('[persistMissingThumbnail] Failed to determine metadata state:', stateError)
      throw error
    }
    if (stored?.objectKey !== thumbnail.objectKey) {
      await cleanupUncommittedUpload(
        input.r2,
        thumbnail.objectKey,
        [thumbnail.objectKey],
        error,
      )
      throw error
    }

    await releaseStorageReservation(thumbnail.objectKey).catch((releaseError) => {
      console.error('[persistMissingThumbnail] Failed to release consumed reservation:', releaseError)
    })
    return { thumbnail, alreadyPresent: false }
  }
}
