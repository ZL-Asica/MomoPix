import type { ReactElement } from 'react'
import type { AlbumRecord } from '@/lib/storage/types'
import { FolderTree, MoreHorizontal, MoveRight, PencilLine, Plus, Star } from 'lucide-react'
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
  onSetDefault: (albumId: string) => void
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
  const { byParent, rootAlbums } = useAlbumTree(albums)

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
              <button
                type="button"
                className={`h-10 flex-1 rounded-md px-2 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
                  isSelected ? 'bg-primary text-primary-foreground' : ''
                }`}
                onClick={() => onSelectAlbum(album.id)}
              >
                <span className="flex items-center gap-2">
                  <span className="truncate">{displayAlbumName(album)}</span>
                  {isDefaultTarget && <Star className="h-3.5 w-3.5 text-amber-500" />}
                </span>
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-80 group-hover:opacity-100"
                    aria-label={`Album actions for ${displayAlbumName(album)}`}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onRequestRename(album.id)}>
                    <PencilLine className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  {!isDefaultTarget && (
                    <DropdownMenuItem onClick={() => onSetDefault(album.id)}>
                      <Star className="mr-2 h-4 w-4" />
                      Set Default Upload
                    </DropdownMenuItem>
                  )}
                  {album.id !== ROOT_ALBUM_ID && (
                    <DropdownMenuItem onClick={() => onRequestMove(album.id)}>
                      <MoveRight className="mr-2 h-4 w-4" />
                      Move
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={() => onRequestRename(album.id)}>
              <PencilLine className="mr-2 h-4 w-4" />
              Rename
            </ContextMenuItem>
            {!isDefaultTarget && (
              <ContextMenuItem onClick={() => onSetDefault(album.id)}>
                <Star className="mr-2 h-4 w-4" />
                Set Default Upload
              </ContextMenuItem>
            )}
            {album.id !== ROOT_ALBUM_ID && (
              <ContextMenuItem onClick={() => onRequestMove(album.id)}>
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
