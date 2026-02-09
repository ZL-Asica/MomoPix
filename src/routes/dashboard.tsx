import { createFileRoute, redirect } from '@tanstack/react-router'
import { ImageIcon } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardLayout } from '@/features/dashboard/components/DashboardLayout'
import { DashboardTopbar } from '@/features/dashboard/components/DashboardTopbar'
import { ImagesTable } from '@/features/dashboard/components/ImagesTable'
import { SidebarAlbums } from '@/features/dashboard/components/SidebarAlbums'
import { UsageSummary } from '@/features/dashboard/components/UsageSummary'
import { AlbumDialogs } from '@/features/dashboard/dialogs/AlbumDialogs'
import { DeleteImageDialog, MoveImageDialog } from '@/features/dashboard/dialogs/MoveImageDialog'
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
    images,
    isUploading,
    meta,
    mobileSidebarOpen,
    moveAlbum,
    moveImage,
    moveImageId,
    pendingDeleteImageId,
    renameAlbum,
    selectedAlbumId,
    setDefaultAlbum,
    setMobileSidebarOpen,
    setMoveImageId,
    setPendingDeleteImageId,
    setSelectedAlbumId,
    uploadFiles,
  } = useDashboardData()

  const selectedAlbum = albumById.get(selectedAlbumId)

  const { search, setSearch, table } = useImagesTable({
    images,
    onMoveImage: (imageId) => {
      setMoveImageId(imageId)
    },
    onDeleteImage: (imageId) => {
      setPendingDeleteImageId(imageId)
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
            setDefaultDisabled={!selectedAlbumId}
            onSetDefault={() => {
              if (!selectedAlbumId) {
                return
              }
              setDefaultAlbum(selectedAlbumId).catch((error) => {
                toast.error('Failed to set default album', {
                  description: error instanceof Error ? error.message : String(error),
                })
              })
            }}
          />
        </CardHeader>
        <CardContent>
          <ImagesTable table={table} />
        </CardContent>
      </Card>

      <MoveImageDialog
        imageId={moveImageId}
        selectedAlbumId={selectedAlbumId}
        albums={albums}
        onMoveImage={moveImage}
        onClose={() => setMoveImageId(null)}
      />

      <DeleteImageDialog
        imageId={pendingDeleteImageId}
        onDelete={deleteImage}
        onCancel={() => setPendingDeleteImageId(null)}
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
