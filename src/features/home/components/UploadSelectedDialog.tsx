import type { AlbumRecord } from '@/lib/storage/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { LoadingButton } from '@/components/ui/loading-button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatAlbumPath } from '@/lib/storage/albumLabel'

interface UploadSelectedDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isPending: boolean
  albums: AlbumRecord[]
  selectedAlbumId: string
  selectedCount: number
  onSelectAlbum: (albumId: string) => void
  onConfirmUpload: () => void
}

/**
 * Dialog for selecting destination album and confirming selected uploads.
 */
export function UploadSelectedDialog({
  open,
  onOpenChange,
  isPending,
  albums,
  selectedAlbumId,
  selectedCount,
  onSelectAlbum,
  onConfirmUpload,
}: UploadSelectedDialogProps) {
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
          <DialogTitle>Upload selected images</DialogTitle>
          <DialogDescription>
            {isPending
              ? `Uploading ${selectedCount} image(s)...`
              : `Choose an album and upload ${selectedCount} processed image(s).`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="upload-selected-album">Upload to album</Label>
          <Select value={selectedAlbumId} onValueChange={onSelectAlbum} disabled={isPending}>
            <SelectTrigger id="upload-selected-album" className="w-full" aria-label="Upload to album">
              <SelectValue placeholder="Choose album" />
            </SelectTrigger>
            <SelectContent>
              {albums.map(album => (
                <SelectItem key={album.id} value={album.id}>{formatAlbumPath(album, albums)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" disabled={isPending} onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <LoadingButton
            type="button"
            loading={isPending}
            loadingText="Uploading..."
            disabled={selectedCount === 0 || selectedAlbumId.trim().length === 0}
            onClick={() => {
              void onConfirmUpload()
            }}
          >
            Upload selected
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
