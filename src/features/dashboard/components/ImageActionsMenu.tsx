import type { ComponentType, ReactNode } from 'react'
import type { AlbumImageListItem } from '@/lib/storage/types'
import { Code2, Link2, MoreHorizontal, MoveRight, Pencil, Trash2, UserRoundSearch } from 'lucide-react'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { buildImageCopyLines } from '@/features/dashboard/lib/copyFormats'
import { copyLinesToClipboard } from '@/lib/clipboard'

interface ImageActionsCallbacks {
  onRenameImage: (objectKey: string) => void
  onMoveImage: (objectKey: string) => void
  onDeleteImage: (objectKey: string) => void
}

interface ImageActionsProps extends ImageActionsCallbacks {
  image: AlbumImageListItem
}

interface ImageActionsContentPrimitives {
  Item: ComponentType<{
    children: ReactNode
    className?: string
    disabled?: boolean
    onSelect?: (event: Event) => void
  }>
  Label: ComponentType<{
    children: ReactNode
    className?: string
  }>
  Separator: ComponentType<{
    className?: string
  }>
}

/**
 * Copies text and reports the result through toasts.
 */
async function copyLinesWithToast(lines: readonly string[], successMessage: string): Promise<void> {
  try {
    await copyLinesToClipboard(lines)
    toast.success(successMessage)
  }
  catch (error) {
    toast.error('Failed to copy', {
      description: error instanceof Error ? error.message : String(error),
    })
  }
}

function ImageActionsContent({
  image,
  onRenameImage,
  onMoveImage,
  onDeleteImage,
  primitives,
}: ImageActionsProps & { primitives: ImageActionsContentPrimitives }) {
  const [isCopyPending, startCopyTransition] = useTransition()
  const { Item, Label, Separator } = primitives
  const hasPublicUrl = image.publicUrl !== null
  const copyDisabled = !hasPublicUrl || isCopyPending

  return (
    <>
      <Item
        disabled={!hasPublicUrl}
        onSelect={() => {
          if (image.publicUrl === null) {
            return
          }
          window.open(image.publicUrl, '_blank', 'noopener,noreferrer')
        }}
      >
        <UserRoundSearch className="mr-2 h-4 w-4" />
        {hasPublicUrl ? 'View' : 'View (Unavailable)'}
      </Item>
      <Item onSelect={() => onRenameImage(image.objectKey)}>
        <Pencil className="mr-2 h-4 w-4" />
        Rename
      </Item>
      <Item onSelect={() => onMoveImage(image.objectKey)}>
        <MoveRight className="mr-2 h-4 w-4" />
        Move
      </Item>
      <Item className="text-destructive" onSelect={() => onDeleteImage(image.objectKey)}>
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </Item>

      <Separator />
      <Label>Copy</Label>
      <Item
        disabled={copyDisabled}
        onSelect={() => {
          const lines = buildImageCopyLines([image], 'direct')
          if (lines.length === 0) {
            return
          }
          startCopyTransition(async () => {
            await copyLinesWithToast(lines, 'Direct link copied')
          })
        }}
      >
        <Link2 className="mr-2 h-4 w-4" />
        Copy direct link
      </Item>
      <Item
        disabled={copyDisabled}
        onSelect={() => {
          const lines = buildImageCopyLines([image], 'html')
          if (lines.length === 0) {
            return
          }
          startCopyTransition(async () => {
            await copyLinesWithToast(lines, 'HTML image tag copied')
          })
        }}
      >
        <Code2 className="mr-2 h-4 w-4" />
        Copy HTML &lt;img&gt;
      </Item>
      <Item
        disabled={copyDisabled}
        onSelect={() => {
          const lines = buildImageCopyLines([image], 'markdown')
          if (lines.length === 0) {
            return
          }
          startCopyTransition(async () => {
            await copyLinesWithToast(lines, 'Markdown copied')
          })
        }}
      >
        <Code2 className="mr-2 h-4 w-4" />
        Copy Markdown
      </Item>
    </>
  )
}

const dropdownPrimitives: ImageActionsContentPrimitives = {
  Item: DropdownMenuItem,
  Label: DropdownMenuLabel,
  Separator: DropdownMenuSeparator,
}

const contextPrimitives: ImageActionsContentPrimitives = {
  Item: ContextMenuItem,
  Label: ContextMenuLabel,
  Separator: ContextMenuSeparator,
}

export function ImageActionsDropdownMenu(props: ImageActionsProps) {
  const { image } = props

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          aria-label={`Open actions for ${image.name}`}
          className="h-8 w-8"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <ImageActionsContent {...props} primitives={dropdownPrimitives} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface ImageActionsContextMenuProps extends ImageActionsProps {
  children: ReactNode
}

export function ImageActionsContextMenu({
  children,
  ...props
}: ImageActionsContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ImageActionsContent {...props} primitives={contextPrimitives} />
      </ContextMenuContent>
    </ContextMenu>
  )
}
