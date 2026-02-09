import type { AlbumRecord } from '@/lib/storage/types'
import { useForm } from '@tanstack/react-form'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface BulkMoveImagesDialogProps {
  open: boolean
  selectedCount: number
  albums: AlbumRecord[]
  selectedAlbumId: string
  onOpenChange: (open: boolean) => void
  onConfirm: (targetAlbumId: string) => Promise<void>
}

export function BulkMoveImagesDialog({
  open,
  selectedCount,
  albums,
  selectedAlbumId,
  onOpenChange,
  onConfirm,
}: BulkMoveImagesDialogProps) {
  const moveForm = useForm({
    defaultValues: {
      targetAlbumId: selectedAlbumId,
    },
    onSubmit: async ({ value }) => {
      await onConfirm(value.targetAlbumId)
      onOpenChange(false)
    },
  })

  useEffect(() => {
    moveForm.setFieldValue('targetAlbumId', selectedAlbumId)
  }, [moveForm, selectedAlbumId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move Selected Images</DialogTitle>
          <DialogDescription>
            Move
            {' '}
            {selectedCount}
            {' '}
            selected image(s) to another album.
          </DialogDescription>
        </DialogHeader>

        <form
          id="bulk-move-images-form"
          className="space-y-3"
          onSubmit={(event_) => {
            event_.preventDefault()
            void moveForm.handleSubmit().catch((error) => {
              toast.error('Failed to move selected images', {
                description: error instanceof Error ? error.message : String(error),
              })
            })
          }}
        >
          <moveForm.Field name="targetAlbumId">
            {field => (
              <Select value={field.state.value} onValueChange={value => field.handleChange(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Target album" />
                </SelectTrigger>
                <SelectContent>
                  {albums.map(album => (
                    <SelectItem key={album.id} value={album.id}>{album.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </moveForm.Field>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="bulk-move-images-form" disabled={selectedCount === 0}>
            Move
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
