export const encodeImage = async (
  image: ImageData,
  format: SupportedFormat = 'webp',
  quality?: number,
  lossless: boolean = false,
): Promise<ArrayBuffer | Uint8Array> => {
  switch (format) {
    case 'avif': {
      const { encode } = await import('@jsquash/avif')
      return encode(image, {
        quality: quality ?? 50,
        lossless,
      })
    }
    case 'webp': {
      const { encode } = await import('@jsquash/webp')
      return encode(image, {
        quality: quality ?? 85,
      })
    }
    case 'jpeg': {
      const { encode } = await import('@jsquash/jpeg')
      return encode(image, {
        quality: quality ?? 85,
      })
    }
    case 'png': {
      const { optimise } = await import('@jsquash/oxipng')
      // Convert quality to range from 1-4 (larger, quality worsening)
      return optimise(image, {
        level: quality !== undefined
          ? Math.min(4, Math.max(1, 5 - Math.round(quality / 25)))
          : 3, // Default to level 3 (balanced)
      })
    }
    default:
      throw new Error(`Unsupported format: ${format as string}`)
  }
}
