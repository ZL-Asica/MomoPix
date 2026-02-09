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

/**
 * Stores the final image object in R2 with content type and tracing metadata.
 */
export async function putImageObject(
  bucket: R2Bucket,
  input: {
    key: string
    bytes: ArrayBuffer
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

export async function deleteImageObject(bucket: R2Bucket, key: string): Promise<void> {
  await deleteObject(bucket, key)
}
