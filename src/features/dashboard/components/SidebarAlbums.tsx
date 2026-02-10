import type { ReactElement } from 'react'
import type { AlbumRecord } from '@/lib/storage/types'
import { FolderTree, Loader2, MoreHorizontal, MoveRight, PencilLine, Plus, Star } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useAlbumTree } from '@/features/dashboard/hooks/useAlbumTree'
import { ROOT_ALBUM_ID } from '@/lib/storage/types'

interface SidebarAlbumsProps {
  albums: AlbumRecord[]
  selectedAlbumId: string
  defaultAlbumId: string
  onSelectAlbum: (albumId: string) => void
  onCreateAlbumClick: () => void
  onRequestRename: (albumId: string) => void
  onRequestMove: (albumId: string) => void
  onSetDefault: (albumId: string) => Promise<void>
}

function displayAlbumName(album: AlbumRecord): string {
  if (album.id === ROOT_ALBUM_ID) {
    return 'Default'
  }
  return album.name
}

export function SidebarAlbums({
  albums,
  selectedAlbumId,
  defaultAlbumId,
  onSelectAlbum,
  onCreateAlbumClick,
  onRequestRename,
  onRequestMove,
  onSetDefault,
}: SidebarAlbumsProps) {
  const [isSettingDefaultPending, startSetDefaultTransition] = useTransition()
  const [pendingDefaultAlbumId, setPendingDefaultAlbumId] = useState<string | null>(null)
  const { byParent, rootAlbums } = useAlbumTree(albums)

  const handleSetDefault = (albumId: string) => {
    startSetDefaultTransition(async () => {
      setPendingDefaultAlbumId(albumId)
      try {
        await onSetDefault(albumId)
      }
      catch (error) {
        toast.error('Failed to set default album', {
          description: error instanceof Error ? error.message : String(error),
        })
      }
      finally {
        setPendingDefaultAlbumId(null)
      }
    })
  }

  const renderAlbumNode = (album: AlbumRecord): ReactElement => {
    const children = byParent.get(album.id) ?? []
    const isSelected = album.id === selectedAlbumId
    const isDefaultTarget = album.id === defaultAlbumId

    return (
      <div key={album.id} className="space-y-1">
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div
              className={`group flex items-center gap-1 rounded-md px-2 py-1 ${isSelected ? 'bg-primary/10' : 'hover:bg-muted/70'}`}
            >
              <Button
                type="button"
                variant={isSelected ? 'default' : 'ghost'}
                className={`h-10 flex-1 justify-start rounded-md px-2 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
                  isSelected ? 'hover:bg-primary/90' : ''
                }`}
                onClick={() => onSelectAlbum(album.id)}
              >
                <span className="flex items-center gap-2">
                  <span className="truncate">{displayAlbumName(album)}</span>
                  {isDefaultTarget && <Star className="h-3.5 w-3.5 text-amber-500" />}
                </span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-80 group-hover:opacity-100"
                    aria-label={`Album actions for ${displayAlbumName(album)}`}
                    disabled={isSettingDefaultPending}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onRequestRename(album.id)} disabled={isSettingDefaultPending}>
                    <PencilLine className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  {!isDefaultTarget && (
                    <DropdownMenuItem onClick={() => handleSetDefault(album.id)} disabled={isSettingDefaultPending}>
                      {isSettingDefaultPending && pendingDefaultAlbumId === album.id
                        ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        : <Star className="mr-2 h-4 w-4" />}
                      Set Default Upload
                    </DropdownMenuItem>
                  )}
                  {album.id !== ROOT_ALBUM_ID && (
                    <DropdownMenuItem onClick={() => onRequestMove(album.id)} disabled={isSettingDefaultPending}>
                      <MoveRight className="mr-2 h-4 w-4" />
                      Move
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={() => onRequestRename(album.id)} disabled={isSettingDefaultPending}>
              <PencilLine className="mr-2 h-4 w-4" />
              Rename
            </ContextMenuItem>
            {!isDefaultTarget && (
              <ContextMenuItem onClick={() => handleSetDefault(album.id)} disabled={isSettingDefaultPending}>
                {isSettingDefaultPending && pendingDefaultAlbumId === album.id
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <Star className="mr-2 h-4 w-4" />}
                Set Default Upload
              </ContextMenuItem>
            )}
            {album.id !== ROOT_ALBUM_ID && (
              <ContextMenuItem onClick={() => onRequestMove(album.id)} disabled={isSettingDefaultPending}>
                <MoveRight className="mr-2 h-4 w-4" />
                Move
              </ContextMenuItem>
            )}
          </ContextMenuContent>
        </ContextMenu>

        {children.length > 0 && (
          <div className="ml-4 space-y-1 border-l pl-2">
            {children.map(child => renderAlbumNode(child))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-4 w-4" />
            Albums
          </CardTitle>
          <Button size="sm" onClick={onCreateAlbumClick}>
            <Plus className="mr-2 h-4 w-4" />
            Create
          </Button>
        </div>
        <CardDescription>Select where images are stored.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {albums.length === 0
          ? <p className="text-sm text-muted-foreground">No albums</p>
          : <div className="space-y-1">{rootAlbums.map(rootAlbum => renderAlbumNode(rootAlbum))}</div>}
      </CardContent>
    </Card>
  )
}
