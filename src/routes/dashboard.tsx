import { createFileRoute, redirect } from '@tanstack/react-router'
import { ImageIcon } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
    images,
    imageUrlError,
    isUploading,
    meta,
    mobileSidebarOpen,
    moveAlbum,
    moveImage,
    renameImage,
    renameImageObjectKey,
    moveImageObjectKey,
    pendingDeleteObjectKey,
    renameAlbum,
    selectedAlbumId,
    setDefaultAlbum,
    setMobileSidebarOpen,
    setRenameImageObjectKey,
    setMoveImageObjectKey,
    setPendingDeleteObjectKey,
    setSelectedAlbumId,
    uploadFiles,
  } = useDashboardData()

  const selectedAlbum = albumById.get(selectedAlbumId)
  const renameImageTarget = images.find(image => image.objectKey === renameImageObjectKey) ?? null
  const moveImageTarget = images.find(image => image.objectKey === moveImageObjectKey) ?? null
  const moveImageTargets = moveImageTarget ? [moveImageTarget] : []

  const { clearSelection, search, selectedImagesOrdered, setSearch, table } = useImagesTable({
    images,
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
          setSelectedAlbumId(albumId)
          setMobileSidebarOpen(false)
        }}
        onCreateAlbumClick={() => setCreateDialogOpen(true)}
        onRequestRename={setRenameAlbumId}
        onRequestMove={setMoveAlbumId}
        onSetDefault={(albumId) => {
          setDefaultAlbum(albumId).catch((error) => {
            toast.error('Failed to set default album', {
              description: error instanceof Error ? error.message : String(error),
            })
          })
        }}
      />
      <UsageSummary meta={meta} totalSpaceBytes={DEFAULT_TOTAL_SPACE_BYTES} />
    </div>
  ), [albums, meta, selectedAlbumId, setDefaultAlbum, setMobileSidebarOpen, setSelectedAlbumId])

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
              </CardTitle>
              <CardDescription>
                {table.getRowModel().rows.length}
                {' '}
                item(s)
              </CardDescription>
            </div>
            <Badge variant="secondary">{formatBytes(selectedAlbum?.bytesUsed ?? 0)}</Badge>
          </div>

          <DashboardTopbar
            search={search}
            onSearchChange={setSearch}
            fileInputRef={fileInputRef}
            onUploadClick={() => fileInputRef.current?.click()}
            onUploadChange={(files) => {
              void uploadFiles(files).finally(() => {
                if (fileInputRef.current) {
                  fileInputRef.current.value = ''
                }
              })
            }}
            uploadDisabled={isUploading || !selectedAlbumId}
            bulkOptions={(
              <BulkOptionsMenu
                selectedImages={selectedImagesOrdered}
                albums={albums}
                selectedAlbumId={selectedAlbumId}
                onBulkMoveImages={bulkMoveImages}
                onBulkDeleteImages={bulkDeleteImages}
                clearSelection={clearSelection}
              />
            )}
          />
        </CardHeader>
        <CardContent>
          {imageUrlError !== null && (
            <p role="alert" className="mb-3 text-sm text-destructive">
              Image preview URL error:
              {' '}
              {imageUrlError}
            </p>
          )}
          <ImagesTable table={table} />
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
            return
          }
          await moveImage({
            objectKey: moveImageTarget.objectKey,
            targetAlbumId,
          })
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
