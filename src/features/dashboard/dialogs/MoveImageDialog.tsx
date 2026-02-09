import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface DeleteImageDialogProps {
  objectKey: string | null
  onDelete: (objectKey: string) => Promise<void>
  onCancel: () => void
}

export function DeleteImageDialog({ objectKey, onDelete, onCancel }: DeleteImageDialogProps) {
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
        <Button
          variant="destructive"
          onClick={() => {
            void onDelete(objectKey)
          }}
        >
          Delete
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </CardContent>
    </Card>
  )
}
