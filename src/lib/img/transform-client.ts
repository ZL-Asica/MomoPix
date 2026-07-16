import { parseUploadImage } from '@/lib/images/uploadValidation'
import { isAnimatedRaster } from './animation'
import { OUTPUT_MIME_TYPE_BY_FORMAT } from './constants'

/**
 * Largest image the browser transform path will decode and paint.
 *
 * A canvas needs at least four bytes per pixel, so this keeps the working
 * bitmap below roughly 96 MiB before encoder overhead on mobile devices.
 */
export const MAX_TRANSFORM_PIXELS = 24_000_000

/** Normalized image transform error returned to UI. */
export interface TransformError {
  message: string
}

interface TransformImageResult {
  blob: Blob
  mimeType: string
  width: number
  height: number
  preservedOriginal: boolean
}

/**
 * Converts an input image file into the requested target format.
 */
export async function transformImageFile(
  file: File,
  format: SupportedFormat,
  quality?: number,
): Promise<TransformImageResult> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const inputMetadata = parseUploadImage(bytes)
  if (!inputMetadata) {
    throw new Error('Unable to read image dimensions')
  }
  if (inputMetadata.width * inputMetadata.height > MAX_TRANSFORM_PIXELS) {
    throw new Error(`Image dimensions exceed the ${MAX_TRANSFORM_PIXELS / 1_000_000} megapixel transform limit`)
  }
  if (isAnimatedRaster(bytes)) {
    return {
      blob: file,
      mimeType: inputMetadata.mime,
      width: inputMetadata.width,
      height: inputMetadata.height,
      preservedOriginal: true,
    }
  }

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

    return {
      blob,
      mimeType,
      width: bitmap.width,
      height: bitmap.height,
      preservedOriginal: false,
    }
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
