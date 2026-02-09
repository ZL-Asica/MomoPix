import type { AlbumImageListItem, AlbumRecord } from '@/lib/storage/types'
import { useForm } from '@tanstack/react-form'
import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LoadingButton } from '@/components/ui/loading-button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface BulkMoveImagesDialogProps {
  open: boolean
  selectedImages: AlbumImageListItem[]
  albums: AlbumRecord[]
  selectedAlbumId: string
  onOpenChange: (open: boolean) => void
  onConfirm: (targetAlbumId: string) => Promise<boolean>
}

export function BulkMoveImagesDialog({
  open,
  selectedImages,
  albums,
  selectedAlbumId,
  onOpenChange,
  onConfirm,
}: BulkMoveImagesDialogProps) {
  const [isTransitionPending, startTransition] = useTransition()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isPending = isTransitionPending || isSubmitting
  const selectedCount = selectedImages.length
  const moveDescription = selectedCount === 1
    ? `Move "${selectedImages[0]?.name ?? 'image'}"`
    : `Move ${selectedCount} images`

  const moveForm = useForm({
    defaultValues: {
      targetAlbumId: selectedAlbumId,
    },
    onSubmit: async ({ value }) => {
      const shouldClose = await onConfirm(value.targetAlbumId)
      if (shouldClose) {
        onOpenChange(false)
      }
    },
  })

  useEffect(() => {
    moveForm.setFieldValue('targetAlbumId', selectedAlbumId)
  }, [moveForm, selectedAlbumId])

  const handleOpenChange = (nextOpen: boolean) => {
    if (isPending) {
      return
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle>Move images</DialogTitle>
          <DialogDescription>{moveDescription}</DialogDescription>
        </DialogHeader>

        <form
          id="bulk-move-images-form"
          className="space-y-3"
          onSubmit={(event_) => {
            event_.preventDefault()
            if (isSubmitting) {
              return
            }

            setIsSubmitting(true)
            startTransition(() => {
              moveForm.handleSubmit()
                .catch((error) => {
                  toast.error('Failed to move selected images', {
                    description: error instanceof Error ? error.message : String(error),
                  })
                })
                .finally(() => {
                  setIsSubmitting(false)
                })
            })
          }}
        >
          <moveForm.Field
            name="targetAlbumId"
            validators={{
              onSubmit: ({ value }) =>
                value.trim().length === 0 ? 'Select a destination album' : undefined,
            }}
          >
            {(field) => {
              const error = field.state.meta.errors.find(item => typeof item === 'string')
              return (
                <div className="space-y-1">
                  <Select
                    value={field.state.value}
                    onValueChange={value => field.handleChange(value)}
                    disabled={isPending}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Target album" />
                    </SelectTrigger>
                    <SelectContent>
                      {albums.map(album => (
                        <SelectItem key={album.id} value={album.id}>{album.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
              )
            }}
          </moveForm.Field>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            form="bulk-move-images-form"
            disabled={selectedCount === 0}
            loading={isPending}
            loadingText="Moving..."
          >
            Move
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
