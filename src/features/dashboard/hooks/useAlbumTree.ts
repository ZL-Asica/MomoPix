import type { AlbumRecord } from '@/lib/storage/types'
import { useMemo } from 'react'
import { ROOT_ALBUM_ID } from '@/lib/storage/types'

/**
 * Builds a parent-indexed album tree map for nested sidebar rendering.
 *
 * @param albums Flat album records list.
 * @returns Parent-indexed tree and sorted root albums.
 */
export function useAlbumTree(albums: AlbumRecord[]) {
  return useMemo(() => {
    const byParent = new Map<string | null, AlbumRecord[]>()

    for (const album of albums) {
      const parent = album.parentId
      if (!byParent.has(parent)) {
        byParent.set(parent, [])
      }
      byParent.get(parent)?.push(album)
    }

    for (const children of byParent.values()) {
      children.sort((a, b) => {
        if (a.id === ROOT_ALBUM_ID) {
          return -1
        }
        if (b.id === ROOT_ALBUM_ID) {
          return 1
        }
        return a.name.localeCompare(b.name)
      })
    }

    return {
      byParent,
      rootAlbums: byParent.get(null) ?? [],
    }
  }, [albums])
}
