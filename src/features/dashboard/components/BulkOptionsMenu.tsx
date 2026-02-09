import type { ImageCopyFormat } from '@/features/dashboard/lib/copyFormats'
import type { BulkOperationFailure, BulkOperationResult } from '@/features/dashboard/types'
import type { AlbumImageListItem, AlbumRecord } from '@/lib/storage/types'
import { Copy, FolderOutput, Settings2, Trash2 } from 'lucide-react'
import { useMemo, useState, useTransition } from 'react'
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
import { withTimeout } from '@/lib/bulk'
import { copyLinesToClipboard } from '@/lib/clipboard'

const BULK_REQUEST_TIMEOUT_MS = 60_000

interface BulkOptionsMenuProps {
  selectedImages: AlbumImageListItem[]
  albums: AlbumRecord[]
  selectedAlbumId: string
  onBulkMoveImages: (input: { objectKeys: string[], targetAlbumId: string }) => Promise<BulkOperationResult>
  onBulkDeleteImages: (objectKeys: string[]) => Promise<BulkOperationResult>
  clearSelection: () => void
  setSelectionToObjectKeys: (objectKeys: string[]) => void
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
  setSelectionToObjectKeys,
}: BulkOptionsMenuProps) {
  const [moveOpen, setMoveOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isCopyPending, startCopyTransition] = useTransition()

  const selectedCount = selectedImages.length
  const selectedObjectKeys = useMemo(
    () => selectedImages.map(image => image.objectKey),
    [selectedImages],
  )
  const selectedNameByKey = useMemo(() => (
    new Map(selectedImages.map(image => [image.objectKey, image.name]))
  ), [selectedImages])
  const disabled = selectedCount === 0
  const menuDisabled = disabled || isCopyPending

  const formatFailureDetails = (failedItems: BulkOperationFailure[]) => {
    if (failedItems.length === 0) {
      return undefined
    }

    const preview = failedItems.slice(0, 3).map(({ objectKey, reason }) => {
      const name = selectedNameByKey.get(objectKey)
        ?? objectKey.split('/').at(-1)?.replace(/\.[^.]+$/, '')
        ?? objectKey
      return `${name}: ${reason}`
    })
    const hiddenCount = failedItems.length - preview.length
    if (hiddenCount > 0) {
      preview.push(`+${hiddenCount} more failure(s)`)
    }
    return preview.join('\n')
  }

  const applyBulkSelection = (result: BulkOperationResult) => {
    if (result.failedItems.length > 0) {
      setSelectionToObjectKeys(result.failedItems.map(item => item.objectKey))
      return
    }
    clearSelection()
  }

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

  const handleBulkMove = async (targetAlbumId: string): Promise<boolean> => {
    const result = await withTimeout(onBulkMoveImages({
      objectKeys: selectedObjectKeys,
      targetAlbumId,
    }), BULK_REQUEST_TIMEOUT_MS, 'Bulk move timed out. Please retry.')
    applyBulkSelection(result)

    if (result.failed === 0) {
      toast.success(`Moved ${result.succeeded} image(s)`)
      return true
    }

    toast.error(`Moved ${result.succeeded} image(s), ${result.failed} failed`, {
      description: formatFailureDetails(result.failedItems),
    })
    return false
  }

  const handleBulkDelete = async (): Promise<boolean> => {
    const result = await withTimeout(
      onBulkDeleteImages(selectedObjectKeys),
      BULK_REQUEST_TIMEOUT_MS,
      'Bulk delete timed out. Please retry.',
    )
    applyBulkSelection(result)

    if (result.failed === 0) {
      toast.success(`Deleted ${result.succeeded} image(s)`)
      return true
    }

    toast.error(`Deleted ${result.succeeded} image(s), ${result.failed} failed`, {
      description: formatFailureDetails(result.failedItems),
    })
    return false
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" disabled={menuDisabled}>
            <Settings2 className="mr-2 h-4 w-4" />
            Bulk options (
            {selectedCount}
            )
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            disabled={menuDisabled}
            onSelect={() => {
              if (menuDisabled) {
                return
              }
              setMoveOpen(true)
            }}
          >
            <FolderOutput className="mr-2 h-4 w-4" />
            Move...
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={menuDisabled}
            className="text-destructive"
            onSelect={() => {
              if (menuDisabled) {
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
          <DropdownMenuItem
            disabled={menuDisabled}
            onSelect={() => {
              startCopyTransition(async () => {
                await handleCopy('direct')
              })
            }}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy direct links
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={menuDisabled}
            onSelect={() => {
              startCopyTransition(async () => {
                await handleCopy('html')
              })
            }}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy HTML &lt;img&gt;
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={menuDisabled}
            onSelect={() => {
              startCopyTransition(async () => {
                await handleCopy('markdown')
              })
            }}
          >
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
        onConfirm={handleBulkDelete}
      />
    </>
  )
}
