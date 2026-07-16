const configuredMaxSize = Number(import.meta.env.VITE_MAX_SIZE_LIMIT)

/** Largest source file accepted for an in-browser transform. */
export const MAX_SOURCE_INPUT_SIZE_BYTES = 100 * 1024 * 1024

/** Largest source bitmap accepted by the browser transform pipeline. */
export const MAX_TRANSFORM_PIXELS = 24_000_000

/** Maximum edge of the album-only WebP thumbnail. */
export const THUMBNAIL_MAX_EDGE = 512

/**
 * Client-side upload limit in bytes.
 *
 * A deployment may choose a lower Vite value. Only transformed derivatives are
 * subject to the smaller server boundary unless the user retains the original.
 */
export const MAX_SIZE_LIMIT = Number.isFinite(configuredMaxSize) && configuredMaxSize > 0
  ? Math.min(configuredMaxSize, MAX_SOURCE_INPUT_SIZE_BYTES)
  : MAX_SOURCE_INPUT_SIZE_BYTES

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
  'image/heic',
  'image/heif',
  'image/tif',
  'image/tiff',
  'image/x-adobe-dng',
  'image/x-canon-cr2',
  'image/x-canon-cr3',
  'image/x-fuji-raf',
  'image/x-nikon-nef',
  'image/x-olympus-orf',
  'image/x-panasonic-raw',
  'image/x-pentax-pef',
  'image/x-sony-arw',
  'application/octet-stream',
]

/** Filename extensions supported by the browser decoder pipeline. */
export const SUPPORTED_INPUT_EXTENSIONS = new Set([
  '3fr',
  'arw',
  'avif',
  'bmp',
  'cr2',
  'cr3',
  'dng',
  'erf',
  'gif',
  'heic',
  'heif',
  'iiq',
  'jpeg',
  'jpg',
  'kdc',
  'mos',
  'nef',
  'nrw',
  'orf',
  'pef',
  'png',
  'raf',
  'raw',
  'rw2',
  'sr2',
  'srf',
  'tif',
  'tiff',
  'webp',
])

/** MIME type lookup by output format. */
export const OUTPUT_MIME_TYPE_BY_FORMAT: Record<SupportedFormat, string> = {
  avif: 'image/avif',
  webp: 'image/webp',
  jpeg: 'image/jpeg',
  png: 'image/png',
}
