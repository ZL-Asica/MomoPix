import { MAX_TRANSFORM_PIXELS } from './constants'

export interface PixelBudgetDimensions {
  width: number
  height: number
  resized: boolean
}

/** Estimates a smaller canvas for retrying an encoded asset over its byte limit. */
export function shrinkDimensionsForByteBudget(
  width: number,
  height: number,
  currentBytes: number,
  maxBytes: number,
): PixelBudgetDimensions {
  if (
    !Number.isFinite(currentBytes)
    || !Number.isFinite(maxBytes)
    || currentBytes < 1
    || maxBytes < 1
  ) {
    throw new Error('Image byte budget is invalid')
  }
  if (currentBytes <= maxBytes) {
    return { width, height, resized: false }
  }

  // Encoded bytes broadly track pixel count. Leave headroom for codecs whose
  // compression ratio worsens slightly at a different resolution.
  const scale = Math.min(0.9, Math.sqrt(maxBytes / currentBytes) * 0.92)
  return {
    width: Math.max(1, Math.floor(width * scale)),
    height: Math.max(1, Math.floor(height * scale)),
    resized: true,
  }
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
