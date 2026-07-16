import type { DashboardUrlState } from '@/features/dashboard/lib/urlState'
import { useNavigate } from '@tanstack/react-router'
import { ImageIcon } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { AlbumImagePagination } from '@/features/dashboard/components/AlbumImagePagination'
import { BulkOptionsMenu } from '@/features/dashboard/components/BulkOptionsMenu'
import { DashboardLayout } from '@/features/dashboard/components/DashboardLayout'
import { DashboardTopbar } from '@/features/dashboard/components/DashboardTopbar'
import { ImagesTable } from '@/features/dashboard/components/ImagesTable'
import { SidebarAlbums } from '@/features/dashboard/components/SidebarAlbums'
import { ThumbnailMaintenance } from '@/features/dashboard/components/ThumbnailMaintenance'
import { UsageSummary } from '@/features/dashboard/components/UsageSummary'
import { AlbumDialogs } from '@/features/dashboard/dialogs/AlbumDialogs'
import { BulkMoveImagesDialog } from '@/features/dashboard/dialogs/BulkMoveImagesDialog'
import { DeleteAlbumDialog } from '@/features/dashboard/dialogs/DeleteAlbumDialog'
import { DeleteImageDialog } from '@/features/dashboard/dialogs/DeleteImageDialog'
import { RenameImageDialog } from '@/features/dashboard/dialogs/RenameImageDialog'
import { useDashboardData } from '@/features/dashboard/hooks/useDashboardData'
import { useImagesTable } from '@/features/dashboard/hooks/useImagesTable'
import { formatBytes } from '@/lib/storage/format'
import { STORAGE_QUOTA_BYTES } from '@/lib/storage/quota'
import { Route } from '@/routes/dashboard'

/**
 * Stateful dashboard feature that wires albums, images, and mutation dialogs.
 */
export function DashboardFeature() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: '/dashboard' })
  const urlState = useMemo(() => ({
    ...search,
    page: search.page ?? 1,
    pageSize: typeof search.pageSize === 'number' ? search.pageSize : 50,
  }), [search])
  const onUrlStateChange = useCallback((next: Partial<DashboardUrlState>, replace = false) => {
    void navigate({
      search: previous => ({ ...previous, ...next }),
      replace,
    })
  }, [navigate])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [renameAlbumId, setRenameAlbumId] = useState<string | null>(null)
  const [moveAlbumId, setMoveAlbumId] = useState<string | null>(null)
  const {
    albums,
    albumById,
    createAlbum,
    deleteImage,
    deleteAlbum,
    bulkDeleteImages,
    bulkMoveImages,
    goNextPage,
    onPageSizeChange,
    goPrevPage,
    hasNextPage,
    hasPreviousPage,
    images,
    imagesStatus,
    imageUrlError,
    isUploading,
    uploadProgress,
    failedUploadCount,
    meta,
    mobileSidebarOpen,
    pageIndex,
    pageIndexZeroBased,
    pageSize,
    moveAlbum,
    moveImage,
    renameImage,
    renameImageObjectKey,
    moveImageObjectKey,
    pendingDeleteObjectKey,
    renameAlbum,
    pendingDeleteAlbumId,
    selectedAlbumId,
    totalCount,
    totalPages,
    isSearchMode,
    searchQuery,
    onSearchQueryChange,
    setDefaultAlbum,
    setMobileSidebarOpen,
    setRenameImageObjectKey,
    setMoveImageObjectKey,
    setPendingDeleteObjectKey,
    setPendingDeleteAlbumId,
    selectAlbum,
    uploadFiles,
    retryFailedUploads,
    reloadAlbums,
    retryImages,
    albumsStatus,
  } = useDashboardData({
    urlState,
    onUrlStateChange,
  })

  const selectedAlbum = albumById.get(selectedAlbumId)
  const renameImageTarget = images.find(image => image.objectKey === renameImageObjectKey) ?? null
  const moveImageTarget = images.find(image => image.objectKey === moveImageObjectKey) ?? null
  const moveImageTargets = moveImageTarget ? [moveImageTarget] : []

  const handleRenameImageRequest = useCallback((objectKey: string) => {
    setRenameImageObjectKey(objectKey)
  }, [setRenameImageObjectKey])
  const handleMoveImageRequest = useCallback((objectKey: string) => {
    setMoveImageObjectKey(objectKey)
  }, [setMoveImageObjectKey])
  const handleDeleteImageRequest = useCallback((objectKey: string) => {
    setPendingDeleteObjectKey(objectKey)
  }, [setPendingDeleteObjectKey])

  const { clearSelection, selectedImagesOrdered, setSelectionToObjectKeys, table } = useImagesTable({
    images,
    pageIndex: pageIndexZeroBased,
    pageSize,
    onRenameImage: handleRenameImageRequest,
    onMoveImage: handleMoveImageRequest,
    onDeleteImage: handleDeleteImageRequest,
  })

  const sidebar = useMemo(() => (
    <div className="space-y-4">
      <SidebarAlbums
        albums={albums}
        selectedAlbumId={selectedAlbumId}
        defaultAlbumId={meta?.defaultAlbumId ?? selectedAlbumId}
        onSelectAlbum={(albumId) => {
          selectAlbum(albumId)
          setMobileSidebarOpen(false)
        }}
        onCreateAlbumClick={() => setCreateDialogOpen(true)}
        onRequestRename={setRenameAlbumId}
        onRequestMove={setMoveAlbumId}
        onRequestDelete={setPendingDeleteAlbumId}
        onSetDefault={setDefaultAlbum}
      />
      <UsageSummary meta={meta} totalSpaceBytes={STORAGE_QUOTA_BYTES} />
    </div>
  ), [albums, meta, selectedAlbumId, selectAlbum, setDefaultAlbum, setMobileSidebarOpen, setPendingDeleteAlbumId])

  if (albumsStatus.state === 'error') {
    return (
      <DashboardLayout
        title="Dashboard"
        description="Manage uploaded images and albums."
        sidebar={sidebar}
        mobileSidebarOpen={mobileSidebarOpen}
        onMobileSidebarOpenChange={setMobileSidebarOpen}
      >
        <Card>
          <CardHeader>
            <CardTitle>Dashboard unavailable</CardTitle>
            <CardDescription>We could not load your albums. Check your connection and try again.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" onClick={() => void reloadAlbums()} disabled={albumsStatus.isLoading}>
              {albumsStatus.isLoading ? 'Retrying...' : 'Retry'}
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Dashboard"
      description="Manage uploaded images and albums."
      sidebar={sidebar}
      mobileSidebarOpen={mobileSidebarOpen}
      onMobileSidebarOpenChange={setMobileSidebarOpen}
    >
      <ThumbnailMaintenance
        onUpdated={() => {
          retryImages()
          void reloadAlbums()
        }}
      />
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                {selectedAlbum?.name ?? 'Images'}
                {imagesStatus.isFetching && !imagesStatus.isInitialLoading && (
                  <Spinner className="h-4 w-4 text-muted-foreground" />
                )}
              </CardTitle>
              <CardDescription>
                {totalPages !== null
                  ? (
                      <>
                        Page
                        {' '}
                        {pageIndex}
                        {' '}
                        of
                        {' '}
                        {totalPages}
                        {' '}
                        (
                        {totalCount ?? 0}
                        {' '}
                        total images)
                      </>
                    )
                  : (
                      <>
                        Page
                        {' '}
                        {pageIndex}
                        {isSearchMode && ' search results'}
                      </>
                    )}
              </CardDescription>
            </div>
            <Badge variant="secondary">{formatBytes(selectedAlbum?.bytesUsed ?? 0)}</Badge>
          </div>

          <DashboardTopbar
            search={searchQuery}
            onSearchChange={onSearchQueryChange}
            fileInputRef={fileInputRef}
            onUploadClick={() => fileInputRef.current?.click()}
            onUploadChange={(files) => {
              void uploadFiles(files)
              if (fileInputRef.current) {
                fileInputRef.current.value = ''
              }
            }}
            uploadDisabled={isUploading || !selectedAlbumId}
            uploadLoading={isUploading}
            uploadProgress={uploadProgress}
            failedUploadCount={failedUploadCount}
            onRetryFailedUploads={() => void retryFailedUploads()}
            bulkOptions={(
              <BulkOptionsMenu
                selectedImages={selectedImagesOrdered}
                albums={albums}
                selectedAlbumId={selectedAlbumId}
                onBulkMoveImages={bulkMoveImages}
                onBulkDeleteImages={bulkDeleteImages}
                clearSelection={clearSelection}
                setSelectionToObjectKeys={setSelectionToObjectKeys}
              />
            )}
          />
        </CardHeader>
        <CardContent>
          {imagesStatus.state === 'error'
            ? (
                <div role="alert" className="space-y-3 rounded-md border border-destructive/30 p-4 text-sm">
                  <p>We could not load these images. Check your connection and try again.</p>
                  <Button type="button" variant="outline" onClick={retryImages} disabled={imagesStatus.isFetching}>
                    Retry
                  </Button>
                </div>
              )
            : (
                <>
                  {imageUrlError !== null && (
                    <p role="alert" className="mb-3 text-sm text-destructive">
                      Image preview URL error:
                      {' '}
                      {imageUrlError}
                    </p>
                  )}
                  <ImagesTable
                    table={table}
                    isInitialLoading={imagesStatus.isInitialLoading}
                    hasLoadedOnce={imagesStatus.hasLoadedOnce}
                  />
                  <div className="mt-4">
                    <AlbumImagePagination
                      pageIndex={pageIndex}
                      totalPages={totalPages}
                      totalCount={totalCount}
                      pageSize={pageSize}
                      hasPreviousPage={hasPreviousPage}
                      hasNextPage={hasNextPage}
                      isLoading={imagesStatus.isFetching}
                      onPageSizeChange={onPageSizeChange}
                      onPreviousPage={goPrevPage}
                      onNextPage={goNextPage}
                    />
                  </div>
                </>
              )}
        </CardContent>
      </Card>

      <BulkMoveImagesDialog
        open={moveImageObjectKey !== null && moveImageTarget !== null}
        selectedImages={moveImageTargets}
        albums={albums}
        selectedAlbumId={selectedAlbumId}
        onOpenChange={open => !open && setMoveImageObjectKey(null)}
        onConfirm={async (targetAlbumId) => {
          if (moveImageTarget === null) {
            return false
          }
          await moveImage({
            objectKey: moveImageTarget.objectKey,
            targetAlbumId,
          })
          return true
        }}
      />

      <RenameImageDialog
        image={renameImageTarget}
        open={renameImageObjectKey !== null}
        onOpenChange={open => !open && setRenameImageObjectKey(null)}
        onRenameImage={renameImage}
      />

      <DeleteImageDialog
        objectKey={pendingDeleteObjectKey}
        onDelete={deleteImage}
        onCancel={() => setPendingDeleteObjectKey(null)}
      />

      <DeleteAlbumDialog
        album={pendingDeleteAlbumId === null ? null : (albumById.get(pendingDeleteAlbumId) ?? null)}
        albums={albums}
        onDelete={deleteAlbum}
        onCancel={() => setPendingDeleteAlbumId(null)}
      />

      <AlbumDialogs
        albums={albums}
        selectedAlbumId={selectedAlbumId}
        createDialogOpen={createDialogOpen}
        onCreateDialogOpenChange={setCreateDialogOpen}
        renameAlbumId={renameAlbumId}
        onRenameAlbumIdChange={setRenameAlbumId}
        moveAlbumId={moveAlbumId}
        onMoveAlbumIdChange={setMoveAlbumId}
        onCreateAlbum={createAlbum}
        onRenameAlbum={renameAlbum}
        onMoveAlbum={moveAlbum}
      />
    </DashboardLayout>
  )
}
