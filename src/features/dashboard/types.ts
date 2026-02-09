import type { AlbumImageRecord, AlbumRecord, StorageMeta } from '@/lib/storage/types'

export interface DashboardState {
  albums: AlbumRecord[]
  images: AlbumImageRecord[]
  meta: StorageMeta | null
  selectedAlbumId: string
}

export interface CreateAlbumInput {
  name: string
  parentId: string | null
}

export interface RenameAlbumInput {
  albumId: string
  name: string
}

export interface MoveAlbumInput {
  albumId: string
  parentId: string | null
}

export interface MoveImageInput {
  imageId: string
  targetAlbumId: string
}
