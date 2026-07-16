import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useCompressedDownloads } from '@/features/home/hooks/useCompressedDownloads'
import { useCopyLinks } from '@/features/home/hooks/useCopyLinks'
import { useHomeAuth } from '@/features/home/hooks/useHomeAuth'
import { useImageTransformQueue } from '@/features/home/hooks/useImageTransformQueue'
import { useSelection } from '@/features/home/hooks/useSelection'
import { useUploadSelected } from '@/features/home/hooks/useUploadSelected'
import TransformControl from '@/features/home/TransformControl'
import { ResultsList } from './ResultsList'
import { TransformDropzone } from './TransformDropzone'
import { UploadedLinksPanel } from './UploadedLinksPanel'
import { UploadSelectedDialog } from './UploadSelectedDialog'

/**
 * Stateful home page feature orchestrating compression, selection, upload, and copy flows.
 */
export function HomeFeature() {
  const { isAuthed } = useHomeAuth()

  const {
    items,
    targetFormat,
    setTargetFormat,
    quality,
    setQuality,
    useManualQuality,
    setUseManualQuality,
    compressionState,
    compressedCount,
    isTransforming,
    addImages,
    removeItem,
    transformAll,
    retryTransform,
    patchItem,
  } = useImageTransformQueue()

  const isCompressing = compressionState === 'compressing'

  const selection = useSelection(items, isAuthed)

  const {
    albums,
    uploadDialogOpen,
    setUploadDialogOpen,
    selectedAlbumId,
    accountDataError,
    setSelectedAlbumId,
    isLoadingAccountData,
    isRefreshingAccountData,
    reloadAccountData,
    uploadState,
    uploadSummary,
    uploadSelected,
  } = useUploadSelected({
    enabled: isAuthed,
    items,
    selectedIds: selection.selectedIds,
    patchItem,
    removeSelection: selection.removeSelection,
  })

  const isUploading = uploadState === 'uploading'
  const isActionLocked = isTransforming || isUploading
  const isUploadAccountUnavailable = accountDataError !== null

  const copyItems = useMemo(() => {
    return items.map(item => ({
      ...item,
      selected: selection.selectedIds.has(item.id),
    }))
  }, [items, selection.selectedIds])

  const {
    isCopyPending,
    uploadedCount,
    selectedUploadedCount,
    copySelectedUploaded,
    copyAllUploaded,
  } = useCopyLinks(copyItems)

  const {
    downloadingAll,
    downloadOne: handleDownload,
    downloadAll: handleDownloadAll,
  } = useCompressedDownloads(items)

  return (
    <div className="container mx-auto space-y-6 p-4">
      <h1 className="text-center text-2xl font-bold">Image Transformer</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <TransformDropzone onDrop={addImages} disabled={isActionLocked} />

          <TransformControl
            targetFormat={targetFormat}
            setTargetFormat={setTargetFormat}
            quality={quality}
            setQuality={setQuality}
            isProcessing={isActionLocked}
            onTransform={transformAll}
            hasImages={items.length > 0}
            useManualQuality={useManualQuality}
            setUseManualQuality={setUseManualQuality}
            actionLabel="Compress"
          />

          {isAuthed && (
            <UploadedLinksPanel
              uploadedCount={uploadedCount}
              selectedUploadedCount={selectedUploadedCount}
              isCopyPending={isCopyPending}
              onCopySelected={copySelectedUploaded}
              onCopyAll={copyAllUploaded}
            />
          )}

          {isAuthed && isLoadingAccountData && (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                Loading upload albums...
              </CardContent>
            </Card>
          )}
          {isAuthed && isUploadAccountUnavailable && (
            <Card role="alert">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6 text-sm">
                <p>Could not load upload albums. Retry before uploading images.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isRefreshingAccountData || isUploading}
                  onClick={reloadAccountData}
                >
                  {isRefreshingAccountData ? 'Retrying...' : 'Retry'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="min-w-0">
          <ResultsList
            items={items}
            isAuthed={isAuthed}
            isCompressing={isCompressing}
            compressionState={compressionState}
            compressedCount={compressedCount}
            isUploading={isUploading}
            uploadState={uploadState}
            uploadSummary={uploadSummary}
            selectedIds={selection.selectedIds}
            selectedCount={selection.selectedCount}
            selectableCount={selection.selectableCount}
            isAllSelected={selection.isAllSelected}
            isIndeterminate={selection.isIndeterminate}
            selectionDisabled={isActionLocked}
            uploadDisabled={isUploadAccountUnavailable}
            actionDisabled={isActionLocked}
            downloadingAll={downloadingAll}
            onToggleSelected={(id, selected) => {
              if (isActionLocked) {
                return
              }
              selection.toggleOne(id, selected)
            }}
            onToggleAll={(selected) => {
              if (isActionLocked) {
                return
              }
              selection.toggleAll(selected)
            }}
            onDownload={handleDownload}
            onDownloadAll={handleDownloadAll}
            onRemove={(id) => {
              if (isActionLocked) {
                return
              }
              removeItem(id)
            }}
            onRetryTransform={(id) => {
              if (isActionLocked) {
                return
              }
              void retryTransform(id)
            }}
            onUploadSelectedClick={() => {
              if (isUploadAccountUnavailable) {
                return
              }
              setUploadDialogOpen(true)
            }}
          />
        </div>
      </div>

      {isAuthed && (
        <UploadSelectedDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          isPending={isUploading}
          albums={albums}
          selectedAlbumId={selectedAlbumId}
          selectedCount={selection.selectedCount}
          onSelectAlbum={setSelectedAlbumId}
          onConfirmUpload={uploadSelected}
        />
      )}
    </div>
  )
}
