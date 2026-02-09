import type { HomeProcessedItem } from '@/features/home/types'
import { AlertCircle, Download, RotateCcw, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  const compressedSize = item.compressedSize
  const isCompressed = item.status === 'compressed' && compressedSize !== null
  const isSelectable = item.status === 'compressed' && item.compressedFile !== null
  const savedPercent = isCompressed && item.originalSize > 0
    ? ((item.originalSize - compressedSize) / item.originalSize) * 100
    : 0
  const sizeLabel = isCompressed
    ? (savedPercent >= 0 ? `Saved ${savedPercent.toFixed(1)}%` : `Increased ${Math.abs(savedPercent).toFixed(1)}%`)
    : null
  const sizeLabelClass = savedPercent >= 0 ? 'text-emerald-600' : 'text-red-600'

  return (
    <article className="rounded-lg border border-gray-100 p-4 dark:border-gray-800" role="listitem">
      <div className="flex items-start gap-3">
        {isAuthed && (
          <div className="pt-1">
            <input
              type="checkbox"
              aria-label={`Select ${item.originalName}`}
              checked={isSelected}
              disabled={selectionDisabled || !isSelectable}
              onChange={event_ => onToggleSelected(event_.target.checked)}
            />
          </div>
        )}

        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg">
          <img
            src={item.originalPreviewUrl}
            alt={`Preview of ${item.originalName}`}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{baseName(item.originalName)}</p>
              <p className="text-xs text-muted-foreground">
                {getHumanReadableFileSize(item.originalSize)}
                {item.compressedSize !== null && (
                  <>
                    {' '}
                    {'->'}
                    {' '}
                    {getHumanReadableFileSize(item.compressedSize)}
                  </>
                )}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {isCompressed && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={onDownload}
                  aria-label={`Download ${item.originalName}`}
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
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {item.status === 'idle' && <Badge variant="outline">Ready</Badge>}
            {item.status === 'compressing' && (
              <Badge variant="outline" className="gap-1">
                <Spinner className="h-3 w-3" />
                Compressing
              </Badge>
            )}
            {item.status === 'compressed' && <Badge variant="outline">Compressed</Badge>}
            {item.status === 'error' && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Compression failed
              </Badge>
            )}

            {sizeLabel !== null && (
              <span className={sizeLabelClass}>{sizeLabel}</span>
            )}
          </div>

          {item.transformError !== null && item.transformError.length > 0 && (
            <p className="text-xs text-destructive">{item.transformError}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs">
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
            <p className="text-xs text-destructive">{item.uploadError}</p>
          )}
        </div>
      </div>
    </article>
  )
}
