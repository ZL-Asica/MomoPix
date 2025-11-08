export const getImageStats = (image: ImageFile): ImageStats => {
  const isTransformed
    = image.transformed !== undefined && image.transformed !== null

  const compressedSize
    = isTransformed && image.compressedSize != null
      ? image.compressedSize
      : null

  const originalSize = image.originalSize

  let savedPercent = 0
  let sizePercent = 100

  if (compressedSize != null && originalSize > 0) {
    savedPercent = ((originalSize - compressedSize) / originalSize) * 100
    sizePercent = (compressedSize / originalSize) * 100
  }

  const sourceFormat
    = image.format?.split('/')[1]?.toUpperCase() ?? 'UNKNOWN'

  const targetFormat = isTransformed
    ? image.targetFormat?.toUpperCase()
    : undefined

  const displayName = image.name.split('.').slice(0, -1).join('.') || image.name

  const savedLabel
    = savedPercent >= 0
      ? `Saved ${savedPercent.toFixed(1)}%`
      : `Increased ${Math.abs(savedPercent).toFixed(1)}%`

  const savedClassName
    = savedPercent >= 0
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-red-600 dark:text-red-400'

  return {
    isTransformed,
    compressedSize,
    savedPercent,
    sizePercent,
    sourceFormat,
    targetFormat,
    displayName,
    savedLabel,
    savedClassName,
  }
}
