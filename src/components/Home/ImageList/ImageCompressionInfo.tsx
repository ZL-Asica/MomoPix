import CompressionRing from './CompressionRing'

interface ImageCompressionInfoProps {
  stats: ImageStats
}

const ImageCompressionInfo = ({ stats }: ImageCompressionInfoProps) => {
  if (!stats.isTransformed) {
    return (
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Ready to compress
      </p>
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <CompressionRing
            percent={stats.savedPercent > 0 ? stats.savedPercent : 0}
            positive={stats.savedPercent >= 0}
          />
          <span className={`font-medium ${stats.savedClassName}`}>
            {stats.savedLabel}
          </span>
        </div>
        <span className="text-gray-500 dark:text-gray-400">
          {stats.sizePercent.toFixed(0)}
          % of original size
        </span>
      </div>
    </div>
  )
}

export default ImageCompressionInfo
