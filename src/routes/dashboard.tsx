import { createFileRoute, redirect } from '@tanstack/react-router'
import { ImageIcon } from 'lucide-react'
import { useMemo, useRef, useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { AlbumImagePagination } from '@/features/dashboard/components/AlbumImagePagination'
import { BulkOptionsMenu } from '@/features/dashboard/components/BulkOptionsMenu'
import { DashboardLayout } from '@/features/dashboard/components/DashboardLayout'
import { DashboardTopbar } from '@/features/dashboard/components/DashboardTopbar'
import { ImagesTable } from '@/features/dashboard/components/ImagesTable'
import { SidebarAlbums } from '@/features/dashboard/components/SidebarAlbums'
import { UsageSummary } from '@/features/dashboard/components/UsageSummary'
import { AlbumDialogs } from '@/features/dashboard/dialogs/AlbumDialogs'
import { BulkMoveImagesDialog } from '@/features/dashboard/dialogs/BulkMoveImagesDialog'
import { DeleteImageDialog } from '@/features/dashboard/dialogs/MoveImageDialog'
import { RenameImageDialog } from '@/features/dashboard/dialogs/RenameImageDialog'
import { useDashboardData } from '@/features/dashboard/hooks/useDashboardData'
import { useImagesTable } from '@/features/dashboard/hooks/useImagesTable'
import { getCurrentUserFn } from '@/functions/auth'
import { formatBytes } from '@/lib/storage/format'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const user = await getCurrentUserFn()
    if (!user) {
      throw redirect({ to: '/login' })
    }
  },
  component: DashboardPage,
})

const DEFAULT_TOTAL_SPACE_BYTES = 5 * 1024 * 1024 * 1024

function DashboardPage() {
  const [isUploadPending, startUploadTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [renameAlbumId, setRenameAlbumId] = useState<string | null>(null)
  const [moveAlbumId, setMoveAlbumId] = useState<string | null>(null)
  const {
    albums,
    albumById,
    createAlbum,
    deleteImage,
    bulkDeleteImages,
    bulkMoveImages,
    goFirstPage,
    goLastPage,
    goNextPage,
    onPageSizeChange,
    onTablePageIndexChange,
    goPrevPage,
    hasNextPage,
    hasPreviousPage,
    images,
    imagesStatus,
    imageUrlError,
    isUploading,
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
    selectAlbum,
    uploadFiles,
  } = useDashboardData()

  const selectedAlbum = albumById.get(selectedAlbumId)
  const renameImageTarget = images.find(image => image.objectKey === renameImageObjectKey) ?? null
  const moveImageTarget = images.find(image => image.objectKey === moveImageObjectKey) ?? null
  const moveImageTargets = moveImageTarget ? [moveImageTarget] : []

  const { clearSelection, selectedImagesOrdered, setSelectionToObjectKeys, table } = useImagesTable({
    images,
    pageIndex: pageIndexZeroBased,
    pageSize,
    onPageIndexChange: onTablePageIndexChange,
    onRenameImage: (objectKey) => {
      setRenameImageObjectKey(objectKey)
    },
    onMoveImage: (objectKey) => {
      setMoveImageObjectKey(objectKey)
    },
    onDeleteImage: (objectKey) => {
      setPendingDeleteObjectKey(objectKey)
    },
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
        onSetDefault={setDefaultAlbum}
      />
      <UsageSummary meta={meta} totalSpaceBytes={DEFAULT_TOTAL_SPACE_BYTES} />
    </div>
  ), [albums, meta, selectedAlbumId, selectAlbum, setDefaultAlbum, setMobileSidebarOpen])

  return (
    <DashboardLayout
      title="Dashboard"
      description="Manage uploaded images and albums."
      sidebar={sidebar}
      mobileSidebarOpen={mobileSidebarOpen}
      onMobileSidebarOpenChange={setMobileSidebarOpen}
    >
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
              startUploadTransition(async () => {
                try {
                  await uploadFiles(files)
                }
                finally {
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }
              })
            }}
            uploadDisabled={isUploading || isUploadPending || !selectedAlbumId}
            uploadLoading={isUploading || isUploadPending}
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
          {imagesStatus.state === 'error' && imagesStatus.error !== null && (
            <p role="alert" className="mb-3 text-sm text-destructive">
              Failed to load images:
              {' '}
              {imagesStatus.error}
            </p>
          )}
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
              onFirstPage={goFirstPage}
              onLastPage={goLastPage}
            />
          </div>
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
