import type { AlbumRecord } from '@/lib/storage/types'
import { useForm } from '@tanstack/react-form'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface MoveImageDialogProps {
  objectKey: string | null
  selectedAlbumId: string
  albums: AlbumRecord[]
  onMoveImage: (input: { objectKey: string, targetAlbumId: string }) => Promise<void>
  onClose: () => void
}

export function MoveImageDialog({
  objectKey,
  selectedAlbumId,
  albums,
  onMoveImage,
  onClose,
}: MoveImageDialogProps) {
  const moveImageForm = useForm({
    defaultValues: {
      objectKey: objectKey ?? '',
      targetAlbumId: selectedAlbumId,
    },
    onSubmit: async ({ value }) => {
      await onMoveImage({
        objectKey: value.objectKey,
        targetAlbumId: value.targetAlbumId,
      })
    },
  })

  useEffect(() => {
    moveImageForm.setFieldValue('objectKey', objectKey ?? '')
    moveImageForm.setFieldValue('targetAlbumId', selectedAlbumId)
  }, [objectKey, moveImageForm, selectedAlbumId])

  if (objectKey === null) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Move Image</CardTitle>
        <CardDescription>Select the target album for the selected image.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-2 sm:flex-row sm:items-end"
          onSubmit={(event_) => {
            event_.preventDefault()
            void moveImageForm.handleSubmit()
          }}
        >
          <moveImageForm.Field name="objectKey">
            {field => (
              <Input
                value={field.state.value}
                onChange={event_ => field.handleChange(event_.target.value)}
                className="sm:max-w-50"
                placeholder="Object Key"
              />
            )}
          </moveImageForm.Field>
          <moveImageForm.Field name="targetAlbumId">
            {field => (
              <Select value={field.state.value} onValueChange={value => field.handleChange(value)}>
                <SelectTrigger className="w-full sm:max-w-65">
                  <SelectValue placeholder="Target album" />
                </SelectTrigger>
                <SelectContent>
                  {albums.map(album => (
                    <SelectItem key={album.id} value={album.id}>{album.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </moveImageForm.Field>
          <div className="flex gap-2">
            <Button type="submit">Move</Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

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
