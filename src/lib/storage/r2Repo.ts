import type { ImageSource } from '@/lib/storage/types'
import { nanoid } from 'nanoid'
import { deleteObject, putObject } from '@/lib/cloudflare/r2'

function now(): Date {
  return new Date()
}

/**
 * Builds the canonical R2 object key `YYYY/MM/DD/<nanoid8>.<ext>`.
 *
 * Uses UTC date components to keep key formatting consistent across regions.
 *
 * @param input Key builder input.
 * @param input.ext Normalized file extension for the image.
 * @param input.date Optional date source for deterministic tests.
 * @returns Stable date-prefixed object key.
 */
export function buildR2ObjectKey(input: { ext: string, date?: Date }): string {
  const { ext } = input
  const date = input.date ?? now()
  const objectId = nanoid(8)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}/${month}/${day}/${objectId}.${ext}`
}

/** Builds an isolated key for an optional retained source asset. */
export function buildOriginalR2ObjectKey(input: { ext: string, date?: Date }): string {
  return `originals/${buildR2ObjectKey(input)}`
}

/** Builds an isolated key for an album-only WebP preview asset. */
export function buildThumbnailR2ObjectKey(input: { date?: Date } = {}): string {
  return `thumbnails/${buildR2ObjectKey({ ext: 'webp', date: input.date })}`
}

/**
 * Stores the final image object in R2 with content type and tracing metadata.
 *
 * @param bucket R2 bucket binding.
 * @param input Object bytes and metadata payload.
 * @param input.key Canonical object key.
 * @param input.bytes Object bytes.
 * @param input.mime Content MIME type.
 * @param input.albumId Album identifier for tracing.
 * @param input.source Upload source classifier.
 * @param input.uploadedAt ISO timestamp for upload time.
 * @returns Resolves when object write completes.
 */
export async function putImageObject(
  bucket: R2Bucket,
  input: {
    key: string
    bytes: ArrayBuffer | ReadableStream
    mime: string
    albumId: string
    source: ImageSource
    uploadedAt: string
  },
): Promise<void> {
  await putObject(bucket, input.key, input.bytes, {
    httpMetadata: {
      contentType: input.mime,
    },
    customMetadata: {
      objectKey: input.key,
      albumId: input.albumId,
      uploadedAt: input.uploadedAt,
      source: input.source,
    },
  })
}

/**
 * Deletes one image object from R2 by key.
 *
 * @param bucket R2 bucket binding.
 * @param key Canonical object key.
 * @returns Resolves when delete request completes.
 */
export async function deleteImageObject(bucket: R2Bucket, key: string): Promise<void> {
  await deleteObject(bucket, key)
}
