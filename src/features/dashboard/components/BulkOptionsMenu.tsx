import type { ImageCopyFormat } from '@/features/dashboard/lib/copyFormats'
import type { AlbumImageListItem, AlbumRecord } from '@/lib/storage/types'
import { Copy, FolderOutput, Settings2, Trash2 } from 'lucide-react'
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

interface BulkOptionsMenuProps {
  selectedImages: AlbumImageListItem[]
  albums: AlbumRecord[]
  selectedAlbumId: string
  onBulkMoveImages: (input: { objectKeys: string[], targetAlbumId: string }) => Promise<BulkOperationResult>
  onBulkDeleteImages: (objectKeys: string[]) => Promise<BulkOperationResult>
  clearSelection: () => void
}

function copyLabel(format: ImageCopyFormat): string {
  switch (format) {
    case 'direct':
      return 'direct links'
    case 'html':
      return 'HTML <img>'
    case 'markdown':
      return 'Markdown'
  }
}

export function BulkOptionsMenu({
  selectedImages,
  albums,
  selectedAlbumId,
  onBulkMoveImages,
  onBulkDeleteImages,
  clearSelection,
}: BulkOptionsMenuProps) {
  const [moveOpen, setMoveOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const selectedCount = selectedImages.length
  const selectedObjectKeys = useMemo(
    () => selectedImages.map(image => image.objectKey),
    [selectedImages],
  )
  const disabled = selectedCount === 0 || busy

  const handleCopy = async (format: ImageCopyFormat) => {
    const lines = buildImageCopyLines(selectedImages, format)
    if (lines.length === 0) {
      toast.error('No copyable URLs in current selection')
      return
    }

    try {
      await copyLinesToClipboard(lines)
      toast.success(`Copied ${lines.length} ${copyLabel(format)} line(s)`)
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={disabled}>
            <Settings2 className="mr-2 h-4 w-4" />
            Bulk options (
            {selectedCount}
            )
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            disabled={disabled}
            onSelect={() => {
              if (disabled) {
                return
              }
              setMoveOpen(true)
            }}
          >
            <FolderOutput className="mr-2 h-4 w-4" />
            Move...
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={disabled}
            className="text-destructive"
            onSelect={() => {
              if (disabled) {
                return
              }
              setDeleteOpen(true)
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete...
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Copy</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={disabled} onClick={() => { void handleCopy('direct') }}>
            <Copy className="mr-2 h-4 w-4" />
            Copy direct links
          </DropdownMenuItem>
          <DropdownMenuItem disabled={disabled} onClick={() => { void handleCopy('html') }}>
            <Copy className="mr-2 h-4 w-4" />
            Copy HTML &lt;img&gt;
          </DropdownMenuItem>
          <DropdownMenuItem disabled={disabled} onClick={() => { void handleCopy('markdown') }}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Markdown
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <BulkMoveImagesDialog
        open={moveOpen}
        selectedImages={selectedImages}
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
