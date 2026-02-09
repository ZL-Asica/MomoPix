import type { AlbumRecord } from '@/lib/storage/types'
import { useForm } from '@tanstack/react-form'
import { useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ROOT_ALBUM_ID } from '@/lib/storage/types'

const NO_PARENT_VALUE = '__none__'

function displayAlbumName(album: AlbumRecord): string {
  if (album.id === ROOT_ALBUM_ID) {
    return 'Default'
  }
  return album.name
}

interface AlbumDialogsProps {
  albums: AlbumRecord[]
  selectedAlbumId: string
  createDialogOpen: boolean
  onCreateDialogOpenChange: (open: boolean) => void
  renameAlbumId: string | null
  onRenameAlbumIdChange: (albumId: string | null) => void
  moveAlbumId: string | null
  onMoveAlbumIdChange: (albumId: string | null) => void
  onCreateAlbum: (input: { name: string, parentId: string | null }) => Promise<void>
  onRenameAlbum: (input: { albumId: string, name: string }) => Promise<void>
  onMoveAlbum: (input: { albumId: string, parentId: string | null }) => Promise<void>
}

export function AlbumDialogs({
  albums,
  selectedAlbumId,
  createDialogOpen,
  onCreateDialogOpenChange,
  renameAlbumId,
  onRenameAlbumIdChange,
  moveAlbumId,
  onMoveAlbumIdChange,
  onCreateAlbum,
  onRenameAlbum,
  onMoveAlbum,
}: AlbumDialogsProps) {
  const albumById = useMemo(() => new Map(albums.map(album => [album.id, album])), [albums])

  const createAlbumForm = useForm({
    defaultValues: {
      name: '',
      parentId: NO_PARENT_VALUE,
    },
    onSubmit: async ({ value }) => {
      await onCreateAlbum({
        name: value.name,
        parentId: value.parentId === NO_PARENT_VALUE ? null : value.parentId,
      })
      onCreateDialogOpenChange(false)
      createAlbumForm.setFieldValue('name', '')
      createAlbumForm.setFieldValue('parentId', NO_PARENT_VALUE)
    },
  })

  const renameAlbumForm = useForm({
    defaultValues: {
      albumId: renameAlbumId ?? '',
      name: '',
    },
    onSubmit: async ({ value }) => {
      await onRenameAlbum({
        albumId: value.albumId,
        name: value.name,
      })
      onRenameAlbumIdChange(null)
      renameAlbumForm.setFieldValue('name', '')
    },
  })

  const moveAlbumForm = useForm({
    defaultValues: {
      albumId: moveAlbumId ?? '',
      parentId: NO_PARENT_VALUE,
    },
    onSubmit: async ({ value }) => {
      await onMoveAlbum({
        albumId: value.albumId,
        parentId: value.parentId === NO_PARENT_VALUE ? null : value.parentId,
      })
      onMoveAlbumIdChange(null)
    },
  })

  useEffect(() => {
    if (!createDialogOpen) {
      return
    }

    // Default to currently selected album to optimize nested album creation from current context.
    createAlbumForm.setFieldValue('parentId', selectedAlbumId)
  }, [createAlbumForm, createDialogOpen, selectedAlbumId])

  useEffect(() => {
    if (renameAlbumId === null) {
      return
    }

    const target = albumById.get(renameAlbumId)
    renameAlbumForm.setFieldValue('albumId', renameAlbumId)
    renameAlbumForm.setFieldValue('name', target?.name ?? '')
  }, [albumById, renameAlbumForm, renameAlbumId])

  useEffect(() => {
    if (moveAlbumId === null) {
      return
    }

    const target = albumById.get(moveAlbumId)
    moveAlbumForm.setFieldValue('albumId', moveAlbumId)
    moveAlbumForm.setFieldValue('parentId', target?.parentId ?? NO_PARENT_VALUE)
  }, [albumById, moveAlbumForm, moveAlbumId])

  return (
    <>
      <Dialog open={createDialogOpen} onOpenChange={onCreateDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Album</DialogTitle>
            <DialogDescription>Add a top-level or nested album.</DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(event_) => {
              event_.preventDefault()
              void createAlbumForm.handleSubmit()
            }}
          >
            <createAlbumForm.Field
              name="name"
              validators={{
                onChange: ({ value }) => (!value.trim() ? 'Album name is required' : undefined),
              }}
            >
              {field => (
                <div className="space-y-2">
                  <Label htmlFor="create-album-name">Album Name</Label>
                  <Input
                    id="create-album-name"
                    placeholder="Album name"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={event_ => field.handleChange(event_.target.value)}
                  />
                  {field.state.meta.isTouched && !field.state.meta.isValid && (
                    <p className="text-sm text-destructive">{field.state.meta.errors.join(', ')}</p>
                  )}
                </div>
              )}
            </createAlbumForm.Field>

            <createAlbumForm.Field name="parentId">
              {field => (
                <div className="space-y-2">
                  <Label>Parent Album</Label>
                  <Select value={field.state.value} onValueChange={value => field.handleChange(value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select parent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_PARENT_VALUE}>No parent (top-level)</SelectItem>
                      {albums.map(album => (
                        <SelectItem key={album.id} value={album.id}>{displayAlbumName(album)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </createAlbumForm.Field>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onCreateDialogOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Album</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={renameAlbumId !== null} onOpenChange={open => !open && onRenameAlbumIdChange(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Album</DialogTitle>
            <DialogDescription>Update the selected album name.</DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(event_) => {
              event_.preventDefault()
              void renameAlbumForm.handleSubmit()
            }}
          >
            <renameAlbumForm.Field
              name="name"
              validators={{
                onChange: ({ value }) => (!value.trim() ? 'Album name is required' : undefined),
              }}
            >
              {field => (
                <div className="space-y-2">
                  <Label htmlFor="rename-album-name">Album Name</Label>
                  <Input
                    id="rename-album-name"
                    placeholder="Album name"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={event_ => field.handleChange(event_.target.value)}
                  />
                  {field.state.meta.isTouched && !field.state.meta.isValid && (
                    <p className="text-sm text-destructive">{field.state.meta.errors.join(', ')}</p>
                  )}
                </div>
              )}
            </renameAlbumForm.Field>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onRenameAlbumIdChange(null)}>
                Cancel
              </Button>
              <Button type="submit">Rename</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={moveAlbumId !== null} onOpenChange={open => !open && onMoveAlbumIdChange(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Album</DialogTitle>
            <DialogDescription>Choose a new parent for this album.</DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(event_) => {
              event_.preventDefault()
              void moveAlbumForm.handleSubmit()
            }}
          >
            <moveAlbumForm.Field name="parentId">
              {field => (
                <div className="space-y-2">
                  <Label>New Parent</Label>
                  <Select value={field.state.value} onValueChange={value => field.handleChange(value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select parent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_PARENT_VALUE}>No parent (top-level)</SelectItem>
                      {albums.filter(album => album.id !== moveAlbumId).map(album => (
                        <SelectItem key={album.id} value={album.id}>{displayAlbumName(album)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </moveAlbumForm.Field>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onMoveAlbumIdChange(null)}>
                Cancel
              </Button>
              <Button type="submit">Move</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
