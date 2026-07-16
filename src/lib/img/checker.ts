import { extractExtension } from '@/lib/storage/format'
import { MAX_SIZE_LIMIT, SUPPORTED_FORMAT_MIME_TYPES, SUPPORTED_INPUT_EXTENSIONS } from './constants'

export const checkImageFormat = (file: File): string => {
  const extension = extractExtension(file.name)
  if (
    extension === null
    || !SUPPORTED_INPUT_EXTENSIONS.has(extension)
    || (file.type.length > 0
      && file.type !== 'application/octet-stream'
      && !SUPPORTED_FORMAT_MIME_TYPES.includes(file.type.toLowerCase()))
  ) {
    throw new Error('Unsupported image format')
  }
  return extension === 'jpg' ? 'jpeg' : extension
}

export const checkImage = (
  file: File,
): {
  format: string
  name: string
  originalSize: number
} => {
  if (file.size > MAX_SIZE_LIMIT) {
    const maxSizeMB = (MAX_SIZE_LIMIT / (1024 * 1024)).toFixed(2)
    throw new Error(`Image size exceeds ${maxSizeMB}MB`)
  }
  return {
    format: checkImageFormat(file),
    name: file.name,
    originalSize: file.size,
  }
}
