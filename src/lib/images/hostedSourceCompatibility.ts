import { MAX_UPLOAD_SIZE_BYTES } from './uploadValidation'

const HOSTED_SOURCE_MIME_TYPES = new Set([
  'image/apng',
  'image/avif',
  'image/bmp',
  'image/gif',
  'image/jpe',
  'image/jpg',
  'image/jpeg',
  'image/png',
  'image/webp',
])

/** Returns whether an unchanged browser File satisfies the hosted-image boundary. */
export function isHostedSourceUploadCompatible(file: File): boolean {
  const mime = file.type.trim().toLowerCase()
  return file.size <= MAX_UPLOAD_SIZE_BYTES
    && (mime.length === 0 || HOSTED_SOURCE_MIME_TYPES.has(mime))
}
