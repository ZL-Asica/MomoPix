'use clinet'

import { encode as encodeAVIF } from '@jsquash/avif'
import { encode as encodeJPEG } from '@jsquash/jpeg'
import { optimise as encodePNG } from '@jsquash/oxipng'
import { encode as encodeWebP } from '@jsquash/webp'

export const encodeImage = async (
  image: ImageData,
  format: SupportedFormat = 'webp',
  quality?: number,
  lossless: boolean = false,
): Promise<ArrayBuffer | Uint8Array> => {
  switch (format) {
    case 'avif':
      return encodeAVIF(image, {
        quality: quality ?? 50,
        lossless,
      })
    case 'webp':
      return encodeWebP(image, {
        quality: quality ?? 85,
      })
    case 'jpeg':
      return encodeJPEG(image, {
        quality: quality ?? 85,
      })
    case 'png':
      // Convert quality to range from 1-4 (larger, quality worsening)
      return encodePNG(image, {
        level: quality !== undefined
          ? Math.min(4, Math.max(1, 5 - Math.round(quality / 25)))
          : 3, // Default to level 3 (balanced)
      })
    default:
      throw new Error(`Unsupported format: ${format as string}`)
  }
}
