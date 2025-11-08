export const getListSummary = (
  images: ImageFile[],
  transformedImageCount: number,
  isProcessing: boolean,
): ImageListSummary => {
  const totalCount = images.length

  const transformed = images.filter(
    img => img.transformed && typeof img.compressedSize === 'number',
  )

  const transformedCount = transformed.length

  if (!transformedCount) {
    return {
      totalCount,
      transformedCount: 0,
      totalOriginalSize: 0,
      totalCompressedSize: 0,
      savedPercent: 0,
      hasTransformed: false,
      progressDone: 0,
      showProgress: false,
      progressPercent: 0.0,
      ringPercent: 0.0,
      ringPositive: false,
    }
  }

  const totalOriginalSize = transformed.reduce(
    (sum, img) => sum + img.originalSize,
    0,
  )

  const totalCompressedSize = transformed.reduce(
    (sum, img) => sum + (img.compressedSize ?? img.originalSize),
    0,
  )

  const savedPercent
    = totalOriginalSize > 0
      ? ((totalOriginalSize - totalCompressedSize) / totalOriginalSize) * 100
      : 0

  const hasTransformed = transformedCount > 0
  const displaySaved = savedPercent >= 0 ? savedPercent : 0

  const progressDone = Math.min(
    transformedImageCount,
    totalCount,
  )
  const showProgress = isProcessing && totalCount > 0
  const progressPercent = showProgress
    ? (progressDone / totalCount) * 100
    : 0

  const ringPercent = showProgress ? progressPercent : displaySaved
  const ringPositive = showProgress
    ? true
    : savedPercent >= 0

  return {
    totalCount,
    transformedCount,
    totalOriginalSize,
    totalCompressedSize,
    savedPercent,
    hasTransformed,
    progressDone,
    showProgress,
    progressPercent,
    ringPercent,
    ringPositive,
  }
}
