import type { ImageCopyFormat } from '@/features/dashboard/lib/copyFormats'
import type { AlbumImageListItem, AlbumRecord } from '@/lib/storage/types'
import { Copy, FolderOutput, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { BulkDeleteImagesDialog } from '@/features/dashboard/dialogs/BulkDeleteImagesDialog'
import { BulkMoveImagesDialog } from '@/features/dashboard/dialogs/BulkMoveImagesDialog'
import { buildImageCopyLines } from '@/features/dashboard/lib/copyFormats'
import { copyLinesToClipboard } from '@/lib/clipboard'

interface BulkOperationResult {
  total: number
  succeeded: number
  failed: number
}

interface ImagesBulkActionsBarProps {
  selectedImages: AlbumImageListItem[]
  albums: AlbumRecord[]
  selectedAlbumId: string
  onBulkMoveImages: (input: { objectKeys: string[], targetAlbumId: string }) => Promise<BulkOperationResult>
  onBulkDeleteImages: (objectKeys: string[]) => Promise<BulkOperationResult>
  clearSelection: () => void
}

function formatLabel(format: ImageCopyFormat): string {
  switch (format) {
    case 'direct':
      return 'direct links'
    case 'html':
      return 'HTML <img>'
    case 'markdown':
      return 'Markdown'
  }
}

export function ImagesBulkActionsBar({
  selectedImages,
  albums,
  selectedAlbumId,
  onBulkMoveImages,
  onBulkDeleteImages,
  clearSelection,
}: ImagesBulkActionsBarProps) {
  const [moveOpen, setMoveOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const selectedCount = selectedImages.length
  const selectedObjectKeys = useMemo(
    () => selectedImages.map(image => image.objectKey),
    [selectedImages],
  )

  if (selectedCount === 0) {
    return null
  }

  const handleCopy = async (format: ImageCopyFormat) => {
    const lines = buildImageCopyLines(selectedImages, format)
    if (lines.length === 0) {
      toast.error('No copyable URLs in current selection')
      return
    }

    try {
      await copyLinesToClipboard(lines)
      toast.success(`Copied ${lines.length} ${formatLabel(format)} line(s)`)
    }
    catch (error) {
      toast.error('Failed to copy selected images', {
        description: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const handleBulkMove = async (targetAlbumId: string) => {
    setBusy(true)
    try {
      const result = await onBulkMoveImages({
        objectKeys: selectedObjectKeys,
        targetAlbumId,
      })
      if (result.succeeded > 0) {
        clearSelection()
      }
    }
    finally {
      setBusy(false)
    }
  }

  const handleBulkDelete = async () => {
    setBusy(true)
    try {
      const result = await onBulkDeleteImages(selectedObjectKeys)
      if (result.succeeded > 0) {
        clearSelection()
      }
      setDeleteOpen(false)
    }
    catch (error) {
      toast.error('Failed to delete selected images', {
        description: error instanceof Error ? error.message : String(error),
      })
    }
    finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="sticky top-0 z-10 mb-3 flex flex-wrap items-center gap-2 rounded-lg border bg-background p-3">
        <div className="text-sm font-medium">
          {selectedCount}
          {' '}
          selected
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={busy}>
              <Copy className="mr-2 h-4 w-4" />
              Bulk Copy
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Copy</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { void handleCopy('direct') }}>
              Copy direct links
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { void handleCopy('html') }}>
              Copy HTML &lt;img&gt;
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { void handleCopy('markdown') }}>
              Copy Markdown
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => setMoveOpen(true)}
        >
          <FolderOutput className="mr-2 h-4 w-4" />
          Bulk Move
        </Button>

        <Button
          variant="destructive"
          size="sm"
          disabled={busy}
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Bulk Delete
        </Button>

        <Button
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={clearSelection}
          className="ml-auto"
        >
          Clear selection
        </Button>
      </div>

      <BulkMoveImagesDialog
        open={moveOpen}
        selectedCount={selectedCount}
        albums={albums}
        selectedAlbumId={selectedAlbumId}
        onOpenChange={setMoveOpen}
        onConfirm={handleBulkMove}
      />

      <BulkDeleteImagesDialog
        open={deleteOpen}
        selectedCount={selectedCount}
        onOpenChange={setDeleteOpen}
        onConfirm={() => {
          void handleBulkDelete()
        }}
      />
    </>
  )
}
