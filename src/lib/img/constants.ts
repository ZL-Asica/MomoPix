import { MAX_UPLOAD_SIZE_BYTES } from '@/lib/images/uploadValidation'

const configuredMaxSize = Number(import.meta.env.VITE_MAX_SIZE_LIMIT)

/**
 * Client-side upload limit in bytes.
 *
 * A deployment may choose a lower Vite value, but it may never advertise a
 * limit above the server's enforced 10 MiB boundary.
 */
export const MAX_SIZE_LIMIT = Number.isFinite(configuredMaxSize) && configuredMaxSize > 0
  ? Math.min(configuredMaxSize, MAX_UPLOAD_SIZE_BYTES)
  : MAX_UPLOAD_SIZE_BYTES

/** MIME types accepted for input images. */
export const SUPPORTED_FORMAT_MIME_TYPES = [
  'image/apng',
  'image/avif',
  'image/gif',
  'image/jpe',
  'image/jpg',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/bmp',
]

/** MIME type lookup by output format. */
export const OUTPUT_MIME_TYPE_BY_FORMAT: Record<SupportedFormat, string> = {
  avif: 'image/avif',
  webp: 'image/webp',
  jpeg: 'image/jpeg',
  png: 'image/png',
}
