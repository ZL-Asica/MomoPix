/** Maximum accepted upload size in bytes (10 MB). */
export const MAX_SIZE_LIMIT = import.meta.env.VITE_MAX_SIZE_LIMIT !== undefined
  ? parseInt(String(import.meta.env.VITE_MAX_SIZE_LIMIT))
  : 10 * 1024 * 1024

/** MIME types accepted for input images. */
export const SUPPORTED_FORMAT_MIME_TYPES = [
  'image/apng',
  'image/avif',
  'image/gif',
  'image/jpe',
  'image/jpg',
  'image/jpeg',
  'image/png',
  'image/svg+xml',
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
