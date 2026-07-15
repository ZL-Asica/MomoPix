import type { ImageRecord } from '@/lib/storage/types'
import {
  deleteImageRecords,
  listImagesPendingDeletion,
  markImageForDeletion,
  recordImageCleanupFailure,
} from '@/lib/storage/imagesRepo'
import { deleteImageObject } from '@/lib/storage/r2Repo'

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export interface ImageDeleteResult {
  image: ImageRecord
  cleanupPending: boolean
}

/**
 * Makes an image unavailable immediately, then deletes its R2 object.
 *
 * If either R2 deletion or final metadata removal fails, the tombstoned image
 * remains hidden and is retried by `reconcilePendingImageDeletes`.
 *
 * @param input D1/R2 bindings and the canonical image record.
 * @param input.db D1 metadata binding.
 * @param input.r2 R2 object binding.
 * @param input.image Canonical image metadata being deleted.
 * @returns Whether a later reconciliation attempt is required.
 */
export async function deleteImageSafely(input: {
  db: D1Database
  r2: R2Bucket
  image: ImageRecord
}): Promise<ImageDeleteResult> {
  const { db, r2, image } = input
  await markImageForDeletion(db, image.objectKey)

  try {
    await deleteImageObject(r2, image.objectKey)
    await deleteImageRecords(db, image)
    return { image, cleanupPending: false }
  }
  catch (error) {
    await recordImageCleanupFailure(db, {
      objectKey: image.objectKey,
      message: errorMessage(error),
    })
    return { image, cleanupPending: true }
  }
}

/**
 * Retries a bounded number of tombstoned image deletions.
 *
 * @param input D1/R2 bindings and retry limit.
 * @param input.db D1 metadata binding.
 * @param input.r2 R2 object binding.
 * @param input.limit Maximum tombstones to attempt in one run.
 * @returns Counts suitable for observability without exposing object keys.
 */
export async function reconcilePendingImageDeletes(input: {
  db: D1Database
  r2: R2Bucket
  limit?: number
}): Promise<{ reconciled: number, pending: number }> {
  const pendingImages = await listImagesPendingDeletion(input.db, input.limit ?? 10)
  let reconciled = 0

  for (const image of pendingImages) {
    try {
      await deleteImageObject(input.r2, image.objectKey)
      await deleteImageRecords(input.db, image)
      reconciled += 1
    }
    catch (error) {
      await recordImageCleanupFailure(input.db, {
        objectKey: image.objectKey,
        message: errorMessage(error),
      })
    }
  }

  return {
    reconciled,
    pending: pendingImages.length - reconciled,
  }
}
