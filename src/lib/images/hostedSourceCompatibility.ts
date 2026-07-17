import { MAX_UPLOAD_SIZE_BYTES } from './uploadValidation'

const HOSTED_SOURCE_MIME_TYPES = new Set([
  'image/avif',
  'image/bmp',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
])

/** Returns whether an unchanged browser File satisfies the hosted-image boundary. */
export function isHostedSourceUploadCompatible(file: File): boolean {
  return file.size <= MAX_UPLOAD_SIZE_BYTES
    && HOSTED_SOURCE_MIME_TYPES.has(file.type.toLowerCase())
}
