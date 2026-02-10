import type { HomeProcessedItem, UploadState } from '@/features/home/types'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { LoadingButton } from '@/components/ui/loading-button'
import { Spinner } from '@/components/ui/spinner'
import EmptyImageListState from '@/features/home/ImageList/EmptyImageListState'
import { ResultRow } from './ResultRow'

interface ResultsListProps {
  items: HomeProcessedItem[]
  isAuthed: boolean
  isCompressing: boolean
  compressionState: 'idle' | 'compressing' | 'success' | 'error'
  compressedCount: number
  isUploading: boolean
  uploadState: UploadState
  uploadSummary: { total: number, succeeded: number, failed: number }
  selectedIds: Set<string>
  selectedCount: number
  selectableCount: number
  isAllSelected: boolean
  isIndeterminate: boolean
  selectionDisabled: boolean
  actionDisabled: boolean
  downloadingAll: boolean
  onToggleSelected: (id: string, selected: boolean) => void
  onToggleAll: (selected: boolean) => void
  onDownload: (item: HomeProcessedItem) => void
  onDownloadAll: () => void
  onRemove: (id: string) => void
  onRetryTransform: (id: string) => void
  onUploadSelectedClick: () => void
}

/**
 * Right-column results list for home compression/upload flow.
 */
export function ResultsList({
  items,
  isAuthed,
  isCompressing,
  compressionState,
  compressedCount,
  isUploading,
  uploadState,
  uploadSummary,
  selectedIds,
  selectedCount,
  selectableCount,
  isAllSelected,
  isIndeterminate,
  selectionDisabled,
  actionDisabled,
  downloadingAll,
  onToggleSelected,
  onToggleAll,
  onDownload,
  onDownloadAll,
  onRemove,
  onRetryTransform,
  onUploadSelectedClick,
}: ResultsListProps) {
  if (items.length === 0) {
    return <EmptyImageListState />
  }

  const transformedCount = items.filter(item => item.status === 'compressed').length
  const hasDownloadables = transformedCount > 0

  return (
    <section aria-label="Processed image list" className="space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-100 bg-muted/40 px-3 py-2.5 dark:border-gray-800 dark:bg-gray-900/60">
        <div className="space-y-1 text-sm">
          <p className="font-medium">
            {items.length}
            {' '}
            {items.length === 1 ? 'image' : 'images'}
            {' · '}
            {transformedCount}
            {' '}
            compressed
          </p>
          {isCompressing && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Spinner className="h-3 w-3" />
              Compressing
              {' '}
              {compressedCount}
              /
              {items.length}
            </p>
          )}
          {compressionState === 'error' && !isCompressing && (
            <p className="text-xs text-destructive">Some images failed to compress.</p>
          )}
          {uploadState === 'uploading' && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Spinner className="h-3 w-3" />
              Uploading
              {' '}
              {uploadSummary.succeeded + uploadSummary.failed}
              /
              {uploadSummary.total}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!hasDownloadables || downloadingAll || isUploading}
            onClick={onDownloadAll}
          >
            <Download className="mr-2 h-4 w-4" />
            {downloadingAll ? 'Preparing zip...' : 'Download all'}
          </Button>

          {isAuthed && (
            <>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Checkbox
                  aria-label="Select all compressed rows"
                  checked={isIndeterminate ? 'indeterminate' : isAllSelected}
                  disabled={selectionDisabled || selectableCount === 0}
                  onCheckedChange={checked => onToggleAll(checked === true)}
                />
                Select all
              </label>
              <LoadingButton
                type="button"
                size="sm"
                loading={isUploading}
                loadingText="Uploading..."
                disabled={selectionDisabled || selectedCount === 0}
                onClick={onUploadSelectedClick}
              >
                Upload selected (
                {selectedCount}
                )
              </LoadingButton>
            </>
          )}
        </div>
      </header>

      <div className="space-y-3" role="list">
        {items.map(item => (
          <ResultRow
            key={item.id}
            item={item}
            isAuthed={isAuthed}
            isSelected={selectedIds.has(item.id)}
            selectionDisabled={selectionDisabled}
            actionDisabled={actionDisabled}
            onToggleSelected={selected => onToggleSelected(item.id, selected)}
            onDownload={() => onDownload(item)}
            onRemove={() => onRemove(item.id)}
            onRetryTransform={() => onRetryTransform(item.id)}
          />
        ))}
      </div>
    </section>
  )
}
