import { OUTPUT_MIME_TYPE_BY_FORMAT } from './constants'

/** Normalized image transform error returned to UI. */
export interface TransformError {
  message: string
}

/**
 * Converts an input image file into the requested target format.
 */
export async function transformImageFile(
  file: File,
  format: SupportedFormat,
  quality?: number,
): Promise<{ blob: Blob, mimeType: string, width: number, height: number }> {
  const bitmap = await createImageBitmap(file)

  try {
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height

    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Failed to initialize canvas context')
    }

    context.drawImage(bitmap, 0, 0)

    const mimeType = OUTPUT_MIME_TYPE_BY_FORMAT[format]
    const qualityValue = quality !== undefined ? Math.min(1, Math.max(0.1, quality / 100)) : undefined

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, mimeType, qualityValue)
    })

    if (!blob) {
      throw new Error(`Unable to encode image as ${format}`)
    }
    if (blob.type !== mimeType) {
      throw new Error(`This browser cannot encode images as ${format.toUpperCase()}`)
    }

    return { blob, mimeType, width: bitmap.width, height: bitmap.height }
  }
  finally {
    bitmap.close()
  }
}

/**
 * Maps unknown transform failures to user-safe error messages.
 */
export function normalizeTransformError(error: unknown): TransformError {
  if (error instanceof Error) {
    return { message: error.message }
  }
  if (typeof error === 'string') {
    return { message: error }
  }
  return { message: 'Image transform failed. Please try a different file or format.' }
}
