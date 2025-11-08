import { Badge } from '@/components/ui/badge'
import { getHumanReadableFileSize } from '@/utils/converter'

interface ImageMetaProps {
  displayName: string
  sourceFormat: string
  targetFormat?: string
  originalSize: number
  compressedSize: number | null
}

const ImageMeta = ({
  displayName,
  sourceFormat,
  targetFormat,
  originalSize,
  compressedSize,
}: ImageMetaProps) => {
  return (
    <div className="min-w-0 space-y-1">
      {/* Filename */}
      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
        {displayName}
      </p>

      {/* Format + Size (two lines, mobile-friendly) */}
      <div className="flex flex-col space-y-1 text-xs text-gray-600 dark:text-gray-300 md:flex-row md:items-center md:space-y-0 md:space-x-3">
        {/* line 1: format */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="border-gray-200 px-1.5 py-0 text-[10px] uppercase dark:border-gray-700"
          >
            {sourceFormat}
          </Badge>
          {targetFormat !== undefined && (
            <>
              <span>→</span>
              <Badge
                variant="outline"
                className="border-emerald-200 bg-emerald-50 px-1.5 py-0 text-[10px] uppercase text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-900/30 dark:text-emerald-300"
              >
                {targetFormat}
              </Badge>
            </>
          )}
        </div>

        {/* line 2: size */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-[11px]">
          <span>{getHumanReadableFileSize(originalSize)}</span>
          {compressedSize != null && (
            <>
              <span>→</span>
              <span>{getHumanReadableFileSize(compressedSize)}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ImageMeta
