import type { AlbumRecord } from './types'
import { ROOT_ALBUM_ID } from './types'

/** Builds a human-readable album breadcrumb from canonical path ids. */
export function formatAlbumPath(album: AlbumRecord, albums: readonly AlbumRecord[]): string {
  const namesById = new Map(albums.map(item => [
    item.id,
    item.id === ROOT_ALBUM_ID ? 'Default' : item.name,
  ]))
  return album.path
    .map(id => namesById.get(id) ?? id)
    .join(' / ')
}
