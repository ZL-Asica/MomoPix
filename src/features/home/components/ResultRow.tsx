import type { HomeProcessedItem } from '@/features/home/types'
import { AlertCircle, ArrowRight, Download, RotateCcw, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Spinner } from '@/components/ui/spinner'
import { getHumanReadableFileSize } from '@/utils/converter'

interface ResultRowProps {
  item: HomeProcessedItem
  isAuthed: boolean
  isSelected: boolean
  selectionDisabled: boolean
  actionDisabled: boolean
  onToggleSelected: (selected: boolean) => void
  onDownload: () => void
  onRemove: () => void
  onRetryTransform: () => void
}

function baseName(name: string): string {
  const value = name.split('.').slice(0, -1).join('.').trim()
  return value.length > 0 ? value : name
}

interface ConversionBadgeProps {
  status: HomeProcessedItem['status']
  originalFormat: HomeProcessedItem['originalFormat']
  targetFormat: HomeProcessedItem['targetFormat']
}

function ConversionBadge({ status, originalFormat, targetFormat }: ConversionBadgeProps) {
  return (
    <div className="flex max-w-full flex-wrap items-center gap-1.5">
      <Badge variant="outline" className="shrink-0">
        {originalFormat.toUpperCase()}
      </Badge>
      {status === 'compressed' && (
        <>
          <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden="true" />
          <Badge variant="outline" className="shrink-0 border-emerald-600 text-emerald-600">
            {targetFormat.toUpperCase()}
          </Badge>
        </>
      )}
      {status === 'original' && (
        <Badge variant="outline" className="shrink-0 border-amber-600 text-amber-700">
          Original kept
        </Badge>
      )}
      {status === 'error' && (
        <Badge variant="destructive" className="shrink-0">Error</Badge>
      )}
    </div>
  )
}

/**
 * Renders one processed image row with transform/upload state and row actions.
 */
export function ResultRow({
  item,
  isAuthed,
  isSelected,
  selectionDisabled,
  actionDisabled,
  onToggleSelected,
  onDownload,
  onRemove,
  onRetryTransform,
}: ResultRowProps) {
  const compressedSize = item.outputSize
  const isCompressed = item.status === 'compressed' && compressedSize !== null
  const isOutputAvailable = (item.status === 'compressed' || item.status === 'original') && item.outputFile !== null
  const savedPercent = isCompressed && item.originalSize > 0
    ? ((item.originalSize - compressedSize) / item.originalSize) * 100
    : 0
  const sizeLabel = isCompressed
    ? (savedPercent >= 0 ? `Saved ${savedPercent.toFixed(1)}%` : `Increased ${Math.abs(savedPercent).toFixed(1)}%`)
    : null
  const sizeLabelClass = savedPercent >= 0 ? 'text-emerald-600' : 'text-red-600'

  return (
    <article className="min-w-0 overflow-hidden rounded-lg border border-gray-100 p-4 dark:border-gray-800" role="listitem">
      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
        {isAuthed && (
          <div className="pt-1">
            <Checkbox
              aria-label={`Select ${item.originalName}`}
              checked={isSelected}
              disabled={selectionDisabled || !isOutputAvailable}
              onCheckedChange={checked => onToggleSelected(checked === true)}
              className="h-5 w-5 rounded-md"
            />
          </div>
        )}

        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg sm:h-20 sm:w-20">
          <img
            src={item.originalPreviewUrl}
            alt={`Preview of ${item.originalName}`}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-2 sm:flex-nowrap">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{baseName(item.originalName)}</p>
              <p className="text-xs text-muted-foreground">
                {getHumanReadableFileSize(item.originalSize)}
                {isCompressed && item.outputSize !== null && (
                  <>
                    {' '}
                    {'->'}
                    {' '}
                    {getHumanReadableFileSize(item.outputSize)}
                  </>
                )}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1 self-start">
              {isOutputAvailable && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={onDownload}
                  aria-label={`Download ${item.originalName}`}
                  className="h-9 w-9"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
              {item.status === 'error' && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={onRetryTransform}
                  disabled={actionDisabled}
                  aria-label={`Retry ${item.originalName}`}
                  className="h-9 w-9"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={onRemove}
                disabled={actionDisabled}
                aria-label={`Remove ${item.originalName}`}
                className="h-9 w-9"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex max-w-full flex-wrap items-center gap-2 text-xs">
            <ConversionBadge
              status={item.status}
              originalFormat={item.originalFormat}
              targetFormat={item.targetFormat}
            />
            {item.status === 'compressing' && (
              <Badge variant="outline" className="gap-1">
                <Spinner className="h-3 w-3" />
                Converting
              </Badge>
            )}

            {sizeLabel !== null && (
              <span className={`wrap-break-word ${sizeLabelClass}`}>{sizeLabel}</span>
            )}
            {item.status === 'original' && (
              <span className="wrap-break-word text-amber-700 dark:text-amber-400">
                Converted output was not smaller.
              </span>
            )}
          </div>

          {item.transformError !== null && item.transformError.length > 0 && (
            <p className={`flex items-start gap-1 text-xs ${item.status === 'original' ? 'text-amber-700 dark:text-amber-400' : 'text-destructive'}`}>
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="wrap-break-word">{item.transformError}</span>
            </p>
          )}

          <div className="flex max-w-full flex-wrap items-center gap-2 text-xs">
            {item.uploadStatus === 'uploading' && (
              <Badge variant="outline" className="gap-1">
                <Spinner className="h-3 w-3" />
                Uploading
              </Badge>
            )}
            {item.uploadStatus === 'uploaded' && (
              <Badge variant="outline" className="border-emerald-600 text-emerald-600">
                Uploaded
              </Badge>
            )}
            {item.uploadStatus === 'error' && (
              <Badge variant="destructive">Upload failed</Badge>
            )}
          </div>

          {item.uploadError !== null && item.uploadError.length > 0 && (
            <p className="wrap-break-word text-xs text-destructive">{item.uploadError}</p>
          )}
        </div>
      </div>
    </article>
  )
}
