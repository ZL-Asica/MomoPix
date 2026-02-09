import type { ImageSource } from '@/lib/storage/types'
import { deleteObject, getObject, putObject } from '@/lib/cloudflare/r2'

function now(): Date {
  return new Date()
}

/**
 * Creates the canonical object key format `YYYY/MM/<nanoid8>.<ext>`.
 *
 * @param imageId Unique identifier for the image.
 * @param ext Normalized file extension for the image.
 * @param date Optional date source for deterministic tests.
 */
export function createR2ObjectKey(imageId: string, ext: string, date = now()): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${year}/${month}/${imageId}.${ext}`
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
    imageId: string
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
      imageId: input.imageId,
      albumId: input.albumId,
      uploadedAt: input.uploadedAt,
      source: input.source,
    },
  })
}

export async function getImageObject(bucket: R2Bucket, key: string): Promise<R2ObjectBody | null> {
  return getObject(bucket, key)
}

export async function deleteImageObject(bucket: R2Bucket, key: string): Promise<void> {
  await deleteObject(bucket, key)
}
