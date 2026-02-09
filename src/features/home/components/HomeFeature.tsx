import type { HomeProcessedItem } from '@/features/home/types'
import JSZip from 'jszip'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useCopyLinks } from '@/features/home/hooks/useCopyLinks'
import { useImageTransformQueue } from '@/features/home/hooks/useImageTransformQueue'
import { useSelection } from '@/features/home/hooks/useSelection'
import { useUploadSelected } from '@/features/home/hooks/useUploadSelected'
import TransformControl from '@/features/home/TransformControl'
import { getCurrentUserFn } from '@/functions/auth'
import { ResultsList } from './ResultsList'
import { TransformDropzone } from './TransformDropzone'
import { UploadedLinksPanel } from './UploadedLinksPanel'
import { UploadSelectedDialog } from './UploadSelectedDialog'

function fileBaseName(name: string): string {
  const value = name.split('.').slice(0, -1).join('.').trim()
  return value.length > 0 ? value : name
}

/**
 * Stateful home page feature orchestrating compression, selection, upload, and copy flows.
 */
export function HomeFeature() {
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isAuthed, setIsAuthed] = useState(false)
  const [downloadingAll, startDownloadingAll] = useTransition()

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
    setSelectedAlbumId,
    isLoadingAccountData,
    uploadState,
    uploadSummary,
    uploadSelected,
  } = useUploadSelected({
    enabled: isAuthed,
    items,
    selectedIds: selection.selectedIds,
    patchItem,
    clearSelection: selection.clearSelection,
  })

  const isUploading = uploadState === 'uploading'
  const isActionLocked = isCompressing || isUploading

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

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const currentUser = await getCurrentUserFn()
        if (!cancelled) {
          setIsAuthed(currentUser !== null)
        }
      }
      catch (error) {
        if (!cancelled) {
          setIsAuthed(false)
          toast.error('Failed to load account data', {
            description: error instanceof Error ? error.message : String(error),
          })
        }
      }
      finally {
        if (!cancelled) {
          setIsAuthLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const handleDownload = (item: HomeProcessedItem) => {
    if (item.compressedBlob === null) {
      return
    }

    const url = URL.createObjectURL(item.compressedBlob)
    const ext = item.targetFormat
    const fileName = `${fileBaseName(item.originalName)}.${ext}`
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success(`Downloaded ${fileName}`)
  }

  const handleDownloadAll = () => {
    startDownloadingAll(async () => {
      const transformed = items.filter(item => item.compressedBlob !== null)
      if (transformed.length === 0) {
        toast.error('No compressed images available to download')
        return
      }

      const zip = new JSZip()
      for (const item of transformed) {
        if (!item.compressedBlob) {
          continue
        }
        const fileName = `${fileBaseName(item.originalName)}.${item.targetFormat}`
        zip.file(fileName, item.compressedBlob)
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `images-${new Date().toISOString().slice(0, 10)}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('Downloaded compressed image zip')
    })
  }

  return (
    <div className="container mx-auto space-y-6 p-4">
      <h1 className="text-center text-2xl font-bold">Image Transformer</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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

          {!isAuthLoading && !isAuthed && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Optional upload</CardTitle>
                <CardDescription>Log in to upload compressed results and copy hosted links.</CardDescription>
              </CardHeader>
            </Card>
          )}

          {isAuthed && isLoadingAccountData && (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                Loading upload albums...
              </CardContent>
            </Card>
          )}
        </div>

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
            setUploadDialogOpen(true)
          }}
        />
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
