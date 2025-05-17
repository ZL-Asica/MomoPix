import { MAX_SIZE_LIMIT, SUPPORTED_FORMAT_MIME_TYPES } from './constants'

export const checkImageFormat = (file: File): string => {
  if (!SUPPORTED_FORMAT_MIME_TYPES.includes(file.type)) {
    throw new Error('Unsupported image format')
  }
  return file.type
}

export const checkImage = (
  file: File,
): {
  format: string
  originalSize: number
} => {
  if (file.size > MAX_SIZE_LIMIT) {
    throw new Error('Image size exceeds 10MB')
  }
  return {
    format: checkImageFormat(file),
    originalSize: file.size,
  }
}
