import type { AlbumRecord } from '@/lib/storage/types'
import { AlertTriangle } from 'lucide-react'
import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { LoadingButton } from '@/components/ui/loading-button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ROOT_ALBUM_ID } from '@/lib/storage/types'

interface DeleteAlbumDialogProps {
  album: AlbumRecord | null
  albums: AlbumRecord[]
  onDelete: (input: { albumId: string, targetAlbumId: string }) => Promise<void>
  onCancel: () => void
}

function displayAlbumName(album: AlbumRecord): string {
  return album.id === ROOT_ALBUM_ID ? 'Default' : album.name
}

/** Confirms album deletion after selecting where its contents will be migrated. */
export function DeleteAlbumDialog({ album, albums, onDelete, onCancel }: DeleteAlbumDialogProps) {
  const [isTransitionPending, startTransition] = useTransition()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [targetAlbumId, setTargetAlbumId] = useState<string>(ROOT_ALBUM_ID)
  const isPending = isTransitionPending || isSubmitting

  useEffect(() => {
    if (album !== null) {
      setTargetAlbumId(album.parentId ?? ROOT_ALBUM_ID)
    }
  }, [album])

  const handleConfirm = () => {
    if (album === null || isSubmitting) {
      return
    }
    setIsSubmitting(true)
    startTransition(() => {
      onDelete({ albumId: album.id, targetAlbumId })
        .catch(error => toast.error('Failed to delete album', { description: error instanceof Error ? error.message : String(error) }))
        .finally(() => setIsSubmitting(false))
    })
  }

  return (
    <AlertDialog open={album !== null} onOpenChange={open => !open && !isPending && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia><AlertTriangle /></AlertDialogMedia>
          <AlertDialogTitle>Delete album</AlertDialogTitle>
          <AlertDialogDescription>
            Images and child albums will move to the selected destination. Image files are not deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="delete-album-target">Move contents to</Label>
          <Select value={targetAlbumId} onValueChange={setTargetAlbumId} disabled={isPending}>
            <SelectTrigger id="delete-album-target"><SelectValue /></SelectTrigger>
            <SelectContent>
              {albums.filter(item => item.id !== album?.id && !item.path.includes(album?.id ?? '')).map(item => (
                <SelectItem key={item.id} value={item.id}>{displayAlbumName(item)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <AlertDialogFooter>
          <Button variant="outline" disabled={isPending} onClick={onCancel}>Cancel</Button>
          <LoadingButton variant="destructive" loading={isPending} loadingText="Deleting..." onClick={handleConfirm}>Delete album</LoadingButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
