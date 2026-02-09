import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { getHumanReadableFileSize } from '@/utils/converter'
import CompressionRing from './CompressionRing'

interface ImageListHeaderProps {
  summary: ImageListSummary
  downloadingAll: boolean
  onDownloadAll: () => void
}

const ImageListHeader = ({
  summary,
  downloadingAll,
  onDownloadAll,
}: ImageListHeaderProps) => {
  const {
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
  } = summary

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-muted/40 px-3 py-2.5 text-xs sm:text-sm dark:border-gray-800 dark:bg-gray-900/60">
      <div className="flex items-center gap-3">
        <CompressionRing
          percent={ringPercent}
          positive={ringPositive}
        />

        <div className="space-y-0.5">
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {totalCount}
            {' '}
            {totalCount === 1 ? 'image' : 'images'}
            {hasTransformed && !showProgress && (
              <>
                {' · '}
                {transformedCount}
                {' '}
                transformed
              </>
            )}
            {showProgress && (
              <>
                {' · '}
                transforming
                {' '}
                {progressDone}
                /
                {totalCount}
              </>
            )}
          </p>

          {showProgress
            ? (
                <p className="text-gray-600 dark:text-gray-400">
                  Transforming images...
                  {' '}
                  {progressPercent.toFixed(0)}
                  % completed
                </p>
              )
            : hasTransformed
              ? (
                  <p className="text-gray-600 dark:text-gray-400">
                    On transformed images:
                    {' '}
                    {getHumanReadableFileSize(totalOriginalSize)}
                    {' → '}
                    {getHumanReadableFileSize(totalCompressedSize)}
                    {' · '}
                    {savedPercent >= 0
                      ? `Saved ${savedPercent.toFixed(1)}%`
                      : `+${Math.abs(savedPercent).toFixed(1)}%`}
                  </p>
                )
              : (
                  <p className="text-gray-500 dark:text-gray-500">
                    No transformed images yet
                  </p>
                )}
        </div>
      </div>

      {downloadingAll
        ? (
            <Spinner />
          )
        : (
            <Button
              size="sm"
              variant="outline"
              disabled={!hasTransformed || downloadingAll}
              onClick={onDownloadAll}
              className="whitespace-nowrap"
            >
              Download all
            </Button>
          )}
    </div>
  )
}

export default ImageListHeader
