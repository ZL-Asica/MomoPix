import { AlertTriangle } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { LoadingButton } from '@/components/ui/loading-button'

interface DeleteImageDialogProps {
  objectKey: string | null
  onDelete: (objectKey: string) => Promise<void>
  onCancel: () => void
}

/**
 * Confirm-delete dialog for one image from dashboard actions.
 */
export function DeleteImageDialog({ objectKey, onDelete, onCancel }: DeleteImageDialogProps) {
  const [isTransitionPending, startTransition] = useTransition()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isPending = isTransitionPending || isSubmitting
  const open = objectKey !== null

  const handleOpenChange = (nextOpen: boolean) => {
    if (isPending) {
      return
    }
    if (!nextOpen) {
      onCancel()
    }
  }

  const handleConfirmDelete = () => {
    if (objectKey === null || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    startTransition(() => {
      onDelete(objectKey)
        .catch((error) => {
          toast.error('Failed to delete image', {
            description: error instanceof Error ? error.message : String(error),
          })
        })
        .finally(() => {
          setIsSubmitting(false)
        })
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia>
            <AlertTriangle />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete image</AlertDialogTitle>
          <AlertDialogDescription>
            This image will be permanently removed from storage.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" disabled={isPending} onClick={onCancel}>
            Cancel
          </Button>
          <LoadingButton
            variant="destructive"
            loading={isPending}
            loadingText="Deleting..."
            onClick={handleConfirmDelete}
            disabled={objectKey === null}
          >
            Delete
          </LoadingButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
