import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingButton } from '@/components/ui/loading-button'

interface DeleteImageDialogProps {
  objectKey: string | null
  onDelete: (objectKey: string) => Promise<void>
  onCancel: () => void
}

export function DeleteImageDialog({ objectKey, onDelete, onCancel }: DeleteImageDialogProps) {
  const [isPending, startTransition] = useTransition()

  if (objectKey === null) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirm Delete</CardTitle>
        <CardDescription>This image will be permanently removed from storage.</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2">
        <LoadingButton
          variant="destructive"
          loading={isPending}
          loadingText="Deleting..."
          onClick={() => {
            startTransition(async () => {
              try {
                await onDelete(objectKey)
              }
              catch (error) {
                toast.error('Failed to delete image', {
                  description: error instanceof Error ? error.message : String(error),
                })
              }
            })
          }}
        >
          Delete
        </LoadingButton>
        <Button variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
      </CardContent>
    </Card>
  )
}
