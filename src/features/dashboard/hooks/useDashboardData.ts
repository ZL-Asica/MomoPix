import type {
  BulkMoveImagesInput,
  BulkOperationResult,
  CreateAlbumInput,
  MoveAlbumInput,
  MoveImageInput,
  RenameAlbumInput,
  RenameImageInput,
} from '@/features/dashboard/types'
import type { AlbumImageListItem, AlbumRecord, StorageMeta } from '@/lib/storage/types'
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useUpload } from '@/features/dashboard/hooks/useUpload'
import { createAlbumFn, listAlbumsFn, moveAlbumFn, renameAlbumFn, setDefaultAlbumFn } from '@/functions/albums'
import { deleteImageFn, deleteImagesFn, listImagesFn, moveImageFn, moveImagesFn, renameImageFn } from '@/functions/images'
import { ROOT_ALBUM_ID } from '@/lib/storage/types'

const DEFAULT_IMAGE_PAGE_SIZE = 50
const IMAGE_FETCH_BATCH_SIZE = 200
const SEARCH_DEBOUNCE_MS = 250

type ImagesState = 'idle' | 'loading' | 'success' | 'error'

/**
 * Central dashboard data orchestration for albums, full image datasets, and mutations.
 */
export function useDashboardData() {
  const [albums, setAlbums] = useState<AlbumRecord[]>([])
  const [meta, setMeta] = useState<StorageMeta | null>(null)
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>(ROOT_ALBUM_ID)
  const [images, setImages] = useState<AlbumImageListItem[]>([])
  const [imageUrlError, setImageUrlError] = useState<string | null>(null)
  const [imagesState, setImagesState] = useState<ImagesState>('idle')
  const [imagesError, setImagesError] = useState<string | null>(null)
  const [isImagesFetching, setIsImagesFetching] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_IMAGE_PAGE_SIZE)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [imagesReloadToken, setImagesReloadToken] = useState(0)
  const [isAlbumsLoaded, setIsAlbumsLoaded] = useState(false)
  const [loadedViewKeys, setLoadedViewKeys] = useState<Set<string>>(() => new Set())
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [renameImageObjectKey, setRenameImageObjectKey] = useState<string | null>(null)
  const [moveImageObjectKey, setMoveImageObjectKey] = useState<string | null>(null)
  const [pendingDeleteObjectKey, setPendingDeleteObjectKey] = useState<string | null>(null)
  const [isViewTransitionPending, startViewTransition] = useTransition()
  const imageRequestIdRef = useRef(0)
  const selectedAlbumIdRef = useRef(selectedAlbumId)
  const loadedViewKeysRef = useRef(loadedViewKeys)

  const albumById = useMemo(() => new Map(albums.map(album => [album.id, album])), [albums])
  const selectedAlbum = albumById.get(selectedAlbumId) ?? null
  const currentViewKey = `${selectedAlbumId}|${debouncedSearchQuery}`
  const hasLoadedCurrentView = loadedViewKeys.has(currentViewKey)
  const hasLoadedAnyView = loadedViewKeys.size > 0
  const isSearchMode = debouncedSearchQuery.length > 0
  const totalCount = hasLoadedCurrentView
    ? images.length
    : (isSearchMode ? null : (selectedAlbum?.imageCount ?? 0))
  const totalPages = totalCount === null ? null : Math.max(1, Math.ceil(totalCount / pageSize))
  const hasPreviousPage = pageIndex > 0
  const hasNextPage = totalPages !== null && pageIndex < totalPages - 1
  const isFetching = isImagesFetching || isViewTransitionPending
  const isInitialLoading = !hasLoadedCurrentView && images.length === 0 && (!hasLoadedAnyView || imagesState === 'loading' || isImagesFetching)
  const isPaginationBusy = isFetching

  useEffect(() => {
    selectedAlbumIdRef.current = selectedAlbumId
  }, [selectedAlbumId])

  useEffect(() => {
    loadedViewKeysRef.current = loadedViewKeys
  }, [loadedViewKeys])

  const fetchImagesPage = useCallback(async (input: {
    albumId: string
    cursor: string | null
    query: string
  }) => {
    return listImagesFn({
      data: {
        albumId: input.albumId,
        cursor: input.cursor,
        pageSize: IMAGE_FETCH_BATCH_SIZE,
        sort: 'createdAt-desc',
        query: input.query,
      },
    })
  }, [])

  const loadAlbums = useCallback(async (nextSelectedAlbumId?: string) => {
    const payload = await listAlbumsFn()
    setAlbums(payload.albums)
    setMeta(payload.meta)

    const selectedCandidate = nextSelectedAlbumId ?? selectedAlbumIdRef.current
    const hasSelected = payload.albums.some(album => album.id === selectedCandidate)
    const fallback = payload.meta.defaultAlbumId || ROOT_ALBUM_ID
    const finalSelected = hasSelected ? selectedCandidate : fallback
    setSelectedAlbumId(finalSelected)

    return finalSelected
  }, [])

  const loadImages = useCallback(async (input: {
    albumId: string
    query: string
    viewKey: string
  }) => {
    const requestId = imageRequestIdRef.current + 1
    imageRequestIdRef.current = requestId
    const hadLoadedView = loadedViewKeysRef.current.has(input.viewKey)

    setIsImagesFetching(true)
    setImagesError(null)
    if (!hadLoadedView) {
      setImagesState('loading')
    }

    try {
      const items: AlbumImageListItem[] = []
      let cursor: string | null = null
      let viewImageUrlError: string | null = null

      do {
        const payload = await fetchImagesPage({
          albumId: input.albumId,
          cursor,
          query: input.query,
        })

        if (requestId !== imageRequestIdRef.current) {
          return
        }

        items.push(...payload.items)
        if (viewImageUrlError === null && payload.imageUrlError !== null) {
          viewImageUrlError = payload.imageUrlError
        }

        if (!payload.hasNextPage || payload.nextCursor === null) {
          break
        }

        cursor = payload.nextCursor
      } while (true)

      const nextPageCount = Math.max(1, Math.ceil(items.length / pageSize))
      const nextLastPageIndex = Math.max(0, nextPageCount - 1)
      setPageIndex(previous => Math.min(previous, nextLastPageIndex))
      setImages(items)
      setImageUrlError(viewImageUrlError)
      setImagesState('success')
      setLoadedViewKeys((previous) => {
        if (previous.has(input.viewKey)) {
          return previous
        }
        const next = new Set(previous)
        next.add(input.viewKey)
        return next
      })
    }
    catch (error) {
      if (requestId !== imageRequestIdRef.current) {
        return
      }
      setImagesState('error')
      setImagesError(error instanceof Error ? error.message : String(error))
      throw error
    }
    finally {
      if (requestId === imageRequestIdRef.current) {
        setIsImagesFetching(false)
      }
    }
  }, [fetchImagesPage, pageSize])

  const refreshAlbum = useCallback(async (albumId: string) => {
    await loadAlbums(albumId)
    setPageIndex(0)
    setImagesReloadToken(token => token + 1)
  }, [loadAlbums])

  const { isUploading, uploadFiles } = useUpload({
    selectedAlbumId,
    onUploaded: refreshAlbum,
  })

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim())
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timer)
    }
  }, [searchQuery])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        await loadAlbums()
        if (!cancelled) {
          setIsAlbumsLoaded(true)
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
  }, [loadAlbums])

  useEffect(() => {
    if (!isAlbumsLoaded || !selectedAlbumId) {
      return
    }

    void loadImages({
      albumId: selectedAlbumId,
      query: debouncedSearchQuery,
      viewKey: currentViewKey,
    }).catch((error) => {
      toast.error('Failed to load images', {
        description: error instanceof Error ? error.message : String(error),
      })
    })
  }, [currentViewKey, debouncedSearchQuery, imagesReloadToken, isAlbumsLoaded, loadImages, selectedAlbumId])

  const createAlbum = useCallback(async ({ name, parentId }: CreateAlbumInput) => {
    const payload = await createAlbumFn({
      data: {
        name: name.trim(),
        parentId,
      },
    })

    await refreshAlbum(payload.album.id)
    toast.success('Album created')
  }, [refreshAlbum])

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

    await loadAlbums(albumId)
    toast.success('Album moved')
  }, [loadAlbums])

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

  const bulkMoveImages = useCallback(async ({ objectKeys, targetAlbumId }: BulkMoveImagesInput): Promise<BulkOperationResult> => {
    const result = await moveImagesFn({
      data: {
        objectKeys,
        targetAlbumId,
      },
    })
    await refreshAlbum(selectedAlbumId)

    return result
  }, [refreshAlbum, selectedAlbumId])

  const bulkDeleteImages = useCallback(async (objectKeys: string[]): Promise<BulkOperationResult> => {
    const result = await deleteImagesFn({
      data: {
        objectKeys,
      },
    })
    await refreshAlbum(selectedAlbumId)

    return result
  }, [refreshAlbum, selectedAlbumId])

  const goNextPage = useCallback(() => {
    if (isPaginationBusy || !hasNextPage) {
      return
    }

    startViewTransition(() => {
      setPageIndex(previous => previous + 1)
    })
  }, [hasNextPage, isPaginationBusy, startViewTransition])

  const goPrevPage = useCallback(() => {
    if (isPaginationBusy || !hasPreviousPage) {
      return
    }
    startViewTransition(() => {
      setPageIndex(previous => Math.max(0, previous - 1))
    })
  }, [hasPreviousPage, isPaginationBusy, startViewTransition])

  const goFirstPage = useCallback(() => {
    if (isPaginationBusy || pageIndex === 0) {
      return
    }
    startViewTransition(() => {
      setPageIndex(0)
    })
  }, [isPaginationBusy, pageIndex, startViewTransition])

  const goLastPage = useCallback(() => {
    if (isPaginationBusy || totalPages === null) {
      return
    }
    startViewTransition(() => {
      setPageIndex(Math.max(0, totalPages - 1))
    })
  }, [isPaginationBusy, startViewTransition, totalPages])

  const onPageSizeChange = useCallback((value: number) => {
    if (!Number.isFinite(value) || value <= 0) {
      return
    }
    startViewTransition(() => {
      setPageSize(Math.trunc(value))
      setPageIndex(0)
    })
  }, [startViewTransition])

  const onSearchQueryChange = useCallback((value: string) => {
    startViewTransition(() => {
      setSearchQuery(value)
      setPageIndex(0)
    })
  }, [startViewTransition])

  const selectAlbum = useCallback((albumId: string) => {
    startViewTransition(() => {
      setSelectedAlbumId(albumId)
      setPageIndex(0)
    })
  }, [startViewTransition])

  const onTablePageIndexChange = useCallback((nextPageIndex: number) => {
    if (!Number.isFinite(nextPageIndex)) {
      return
    }
    startViewTransition(() => {
      setPageIndex(Math.max(0, Math.trunc(nextPageIndex)))
    })
  }, [startViewTransition])

  return {
    albums,
    albumById,
    images,
    imageUrlError,
    meta,
    selectedAlbumId,
    selectAlbum,
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
    searchQuery,
    onSearchQueryChange,
    pageIndex: pageIndex + 1,
    pageIndexZeroBased: pageIndex,
    pageSize,
    totalCount,
    totalPages,
    isSearchMode,
    hasPreviousPage,
    hasNextPage,
    goNextPage,
    goPrevPage,
    goFirstPage,
    goLastPage,
    onPageSizeChange,
    onTablePageIndexChange,
    imagesStatus: {
      state: imagesState,
      isFetching,
      isInitialLoading,
      hasLoadedOnce: hasLoadedCurrentView,
      error: imagesError,
    },
  }
}
