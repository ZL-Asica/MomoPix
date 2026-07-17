import { MAX_TRANSFORM_PIXELS } from './constants'

export interface PixelBudgetDimensions {
  width: number
  height: number
  resized: boolean
}

/**
 * Fits raster dimensions within the browser transform pixel budget.
 *
 * The aspect ratio is preserved and dimensions are rounded down so the
 * resulting allocation never exceeds the requested pixel count.
 */
export function fitWithinPixelBudget(
  width: number,
  height: number,
  maxPixels = MAX_TRANSFORM_PIXELS,
): PixelBudgetDimensions {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
    throw new Error('Image dimensions are invalid')
  }
  if (width * height <= maxPixels) {
    return { width: Math.trunc(width), height: Math.trunc(height), resized: false }
  }

  const scale = Math.sqrt(maxPixels / (width * height))
  return {
    width: Math.max(1, Math.floor(width * scale)),
    height: Math.max(1, Math.floor(height * scale)),
    resized: true,
  }
}
