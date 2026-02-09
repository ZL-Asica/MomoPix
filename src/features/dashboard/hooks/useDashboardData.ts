import type { BulkMoveImagesInput, CreateAlbumInput, MoveAlbumInput, MoveImageInput, RenameAlbumInput, RenameImageInput } from '@/features/dashboard/types'
import type { AlbumImageListItem, AlbumRecord, StorageMeta } from '@/lib/storage/types'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useUpload } from '@/features/dashboard/hooks/useUpload'
import { createAlbumFn, listAlbumsFn, moveAlbumFn, renameAlbumFn, setDefaultAlbumFn } from '@/functions/albums'
import { deleteImageFn, deleteImagesFn, listImagesFn, moveImageFn, moveImagesFn, renameImageFn } from '@/functions/images'
import { ROOT_ALBUM_ID } from '@/lib/storage/types'

/**
 * Central dashboard data orchestration for albums, images, and mutations.
 */
export function useDashboardData() {
  const [albums, setAlbums] = useState<AlbumRecord[]>([])
  const [meta, setMeta] = useState<StorageMeta | null>(null)
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>(ROOT_ALBUM_ID)
  const [images, setImages] = useState<AlbumImageListItem[]>([])
  const [imageUrlError, setImageUrlError] = useState<string | null>(null)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [renameImageObjectKey, setRenameImageObjectKey] = useState<string | null>(null)
  const [moveImageObjectKey, setMoveImageObjectKey] = useState<string | null>(null)
  const [pendingDeleteObjectKey, setPendingDeleteObjectKey] = useState<string | null>(null)

  const albumById = useMemo(() => new Map(albums.map(album => [album.id, album])), [albums])

  const loadAlbums = useCallback(async (nextSelectedAlbumId?: string) => {
    const payload = await listAlbumsFn()
    setAlbums(payload.albums)
    setMeta(payload.meta)

    const selectedCandidate = nextSelectedAlbumId ?? selectedAlbumId
    const hasSelected = payload.albums.some(album => album.id === selectedCandidate)
    const fallback = payload.meta.defaultAlbumId || ROOT_ALBUM_ID
    const finalSelected = hasSelected ? selectedCandidate : fallback
    setSelectedAlbumId(finalSelected)

    return finalSelected
  }, [selectedAlbumId])

  const loadImages = useCallback(async (albumId: string) => {
    const payload = await listImagesFn({ data: { albumId } })
    setImages(payload.images)
    setImageUrlError(payload.imageUrlError ?? null)
  }, [])

  const refreshAlbum = useCallback(async (albumId: string) => {
    const selected = await loadAlbums(albumId)
    await loadImages(selected)
  }, [loadAlbums, loadImages])

  const { isUploading, uploadFiles } = useUpload({
    selectedAlbumId,
    onUploaded: refreshAlbum,
  })

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const albumId = await loadAlbums()
        if (!cancelled) {
          await loadImages(albumId)
        }
      }
      catch (error) {
        toast.error('Failed to load dashboard', {
          description: error instanceof Error ? error.message : String(error),
        })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [loadAlbums, loadImages])

  useEffect(() => {
    if (!selectedAlbumId) {
      return
    }

    void loadImages(selectedAlbumId).catch((error) => {
      toast.error('Failed to load images', {
        description: error instanceof Error ? error.message : String(error),
      })
    })
  }, [loadImages, selectedAlbumId])

  const createAlbum = useCallback(async ({ name, parentId }: CreateAlbumInput) => {
    const payload = await createAlbumFn({
      data: {
        name: name.trim(),
        parentId,
      },
    })

    const next = await loadAlbums(payload.album.id)
    await loadImages(next)
    setSelectedAlbumId(payload.album.id)
    toast.success('Album created')
  }, [loadAlbums, loadImages])

  const renameAlbum = useCallback(async ({ albumId, name }: RenameAlbumInput) => {
    await renameAlbumFn({
      data: {
        albumId,
        name: name.trim(),
      },
    })

    await loadAlbums(albumId)
    toast.success('Album renamed')
  }, [loadAlbums])

  const moveAlbum = useCallback(async ({ albumId, parentId }: MoveAlbumInput) => {
    await moveAlbumFn({
      data: {
        albumId,
        parentId,
      },
    })

    const next = await loadAlbums(albumId)
    await loadImages(next)
    toast.success('Album moved')
  }, [loadAlbums, loadImages])

  const setDefaultAlbum = useCallback(async (albumId: string) => {
    await setDefaultAlbumFn({ data: { albumId } })
    await loadAlbums(albumId)
    toast.success('Default album updated')
  }, [loadAlbums])

  const moveImage = useCallback(async ({ objectKey, targetAlbumId }: MoveImageInput) => {
    await moveImageFn({
      data: {
        objectKey,
        targetAlbumId,
      },
    })

    await refreshAlbum(selectedAlbumId)
    setMoveImageObjectKey(null)
    toast.success('Image moved')
  }, [refreshAlbum, selectedAlbumId])

  const renameImage = useCallback(async ({ objectKey, name }: RenameImageInput) => {
    await renameImageFn({
      data: {
        objectKey,
        name: name.trim(),
      },
    })
    await refreshAlbum(selectedAlbumId)
    setRenameImageObjectKey(null)
    toast.success('Image renamed')
  }, [refreshAlbum, selectedAlbumId])

  const deleteImage = useCallback(async (objectKey: string) => {
    await deleteImageFn({ data: { objectKey } })
    await refreshAlbum(selectedAlbumId)
    setPendingDeleteObjectKey(null)
    toast.success('Image deleted')
  }, [refreshAlbum, selectedAlbumId])

  const bulkMoveImages = useCallback(async ({ objectKeys, targetAlbumId }: BulkMoveImagesInput) => {
    const result = await moveImagesFn({
      data: {
        objectKeys,
        targetAlbumId,
      },
    })
    await refreshAlbum(selectedAlbumId)

    if (result.failed === 0) {
      toast.success(`Moved ${result.succeeded} image(s)`)
    }
    else {
      toast.error(`Moved ${result.succeeded} image(s), ${result.failed} failed`)
    }

    return result
  }, [refreshAlbum, selectedAlbumId])

  const bulkDeleteImages = useCallback(async (objectKeys: string[]) => {
    const result = await deleteImagesFn({
      data: {
        objectKeys,
      },
    })
    await refreshAlbum(selectedAlbumId)

    if (result.failed === 0) {
      toast.success(`Deleted ${result.succeeded} image(s)`)
    }
    else {
      toast.error(`Deleted ${result.succeeded} image(s), ${result.failed} failed`)
    }

    return result
  }, [refreshAlbum, selectedAlbumId])

  return {
    albums,
    albumById,
    images,
    imageUrlError,
    meta,
    selectedAlbumId,
    setSelectedAlbumId,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    renameImageObjectKey,
    setRenameImageObjectKey,
    moveImageObjectKey,
    setMoveImageObjectKey,
    pendingDeleteObjectKey,
    setPendingDeleteObjectKey,
    isUploading,
    uploadFiles,
    createAlbum,
    renameAlbum,
    moveAlbum,
    renameImage,
    moveImage,
    deleteImage,
    bulkMoveImages,
    bulkDeleteImages,
    setDefaultAlbum,
  }
}
