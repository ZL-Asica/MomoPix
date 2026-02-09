/**
 * Reads intrinsic pixel dimensions from an image Blob/File in browser runtime.
 *
 * Uses `createImageBitmap` when available because it is reliable and does not
 * require DOM insertion. Falls back to `Image` decode for wider compatibility.
 * Returns `null` on decode failures so uploads can proceed without dimensions.
 */
export async function getImageDimensions(
  blobOrFile: Blob,
): Promise<{ width: number, height: number } | null> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(blobOrFile)
      try {
        return {
          width: bitmap.width,
          height: bitmap.height,
        }
      }
      finally {
        bitmap.close()
      }
    }
    catch {
      // Continue to HTMLImageElement fallback.
    }
  }

  if (typeof Image === 'undefined' || typeof URL === 'undefined') {
    return null
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(blobOrFile)
    const image = new Image()

    image.onload = () => {
      const width = image.naturalWidth
      const height = image.naturalHeight
      URL.revokeObjectURL(objectUrl)
      resolve({ width, height })
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(null)
    }

    image.src = objectUrl
  })
}
