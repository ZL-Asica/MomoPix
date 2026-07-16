import type { AlbumImageListItem } from '@/lib/storage/types'
import { useForm } from '@tanstack/react-form'
import { useEffect, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingButton } from '@/components/ui/loading-button'

interface RenameImageDialogProps {
  image: AlbumImageListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRenameImage: (input: { objectKey: string, name: string }) => Promise<void>
}

export function RenameImageDialog({
  image,
  open,
  onOpenChange,
  onRenameImage,
}: RenameImageDialogProps) {
  const [isPending, startTransition] = useTransition()

  const renameImageForm = useForm({
    defaultValues: {
      objectKey: image?.objectKey ?? '',
      name: image?.name ?? '',
    },
    onSubmit: async ({ value }) => {
      await onRenameImage({
        objectKey: value.objectKey,
        name: value.name.trim(),
      })
      onOpenChange(false)
    },
  })

  useEffect(() => {
    renameImageForm.setFieldValue('objectKey', image?.objectKey ?? '')
    renameImageForm.setFieldValue('name', image?.name ?? '')
  }, [image, renameImageForm])

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
          <DialogTitle>Rename Image</DialogTitle>
          <DialogDescription>
            Update the display name. The image URL and object key will not change.
          </DialogDescription>
        </DialogHeader>

        <form
          id="rename-image-form"
          className="space-y-3"
          onSubmit={(event_) => {
            event_.preventDefault()
            startTransition(async () => {
              try {
                await renameImageForm.handleSubmit()
              }
              catch (error) {
                toast.error('Failed to rename image', {
                  description: error instanceof Error ? error.message : String(error),
                })
              }
            })
          }}
        >
          <renameImageForm.Field name="name">
            {field => (
              <div className="space-y-2">
                <Label htmlFor="rename-image-name">Image name</Label>
                <Input
                  id="rename-image-name"
                  value={field.state.value}
                  onChange={event_ => field.handleChange(event_.target.value)}
                  placeholder="Image name"
                  maxLength={120}
                  autoFocus
                  disabled={isPending}
                />
              </div>
            )}
          </renameImageForm.Field>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            form="rename-image-form"
            disabled={image === null}
            loading={isPending}
            loadingText="Saving..."
          >
            Save
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
