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

interface BulkDeleteImagesDialogProps {
  open: boolean
  selectedCount: number
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<boolean>
}

export function BulkDeleteImagesDialog({
  open,
  selectedCount,
  onOpenChange,
  onConfirm,
}: BulkDeleteImagesDialogProps) {
  const [isTransitionPending, startTransition] = useTransition()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isPending = isTransitionPending || isSubmitting
  const handleOpenChange = (nextOpen: boolean) => {
    if (isPending) {
      return
    }
    onOpenChange(nextOpen)
  }

  const handleConfirm = () => {
    if (isSubmitting) {
      return
    }

    setIsSubmitting(true)
    startTransition(() => {
      onConfirm()
        .then((shouldClose) => {
          if (shouldClose) {
            onOpenChange(false)
          }
        })
        .catch((error) => {
          toast.error('Failed to delete selected images', {
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
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <AlertTriangle />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete Selected Images</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete
            {' '}
            {selectedCount}
            {' '}
            selected image(s).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <LoadingButton
            variant="destructive"
            loading={isPending}
            loadingText="Deleting..."
            onClick={handleConfirm}
            disabled={selectedCount === 0}
          >
            Delete
          </LoadingButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
