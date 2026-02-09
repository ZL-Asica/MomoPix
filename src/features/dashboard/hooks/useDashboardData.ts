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
const SEARCH_DEBOUNCE_MS = 250

type ImagesState = 'idle' | 'loading' | 'success' | 'error'

/**
 * Central dashboard data orchestration for albums, paged images, and mutations.
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
  const [hasNextPage, setHasNextPage] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [pageCursors, setPageCursors] = useState<Array<string | null>>([null])
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_IMAGE_PAGE_SIZE)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [imagesReloadToken, setImagesReloadToken] = useState(0)
  const [isAlbumsLoaded, setIsAlbumsLoaded] = useState(false)
  const [isLastPageResolving, setIsLastPageResolving] = useState(false)
  const [currentTotalCount, setCurrentTotalCount] = useState<number | null>(null)
  const [loadedViewKeys, setLoadedViewKeys] = useState<Set<string>>(() => new Set())
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [renameImageObjectKey, setRenameImageObjectKey] = useState<string | null>(null)
  const [moveImageObjectKey, setMoveImageObjectKey] = useState<string | null>(null)
  const [pendingDeleteObjectKey, setPendingDeleteObjectKey] = useState<string | null>(null)
  const [isViewTransitionPending, startViewTransition] = useTransition()
  const imageRequestIdRef = useRef(0)
  const selectedAlbumIdRef = useRef(selectedAlbumId)
  const pageCursorsRef = useRef(pageCursors)
  const loadedViewKeysRef = useRef(loadedViewKeys)

  const albumById = useMemo(() => new Map(albums.map(album => [album.id, album])), [albums])
  const selectedAlbum = albumById.get(selectedAlbumId) ?? null
  const currentCursor = pageCursors.at(pageIndex) ?? null
  const currentViewKey = `${selectedAlbumId}|${debouncedSearchQuery}|${pageSize}|${currentCursor ?? 'start'}`
  const hasLoadedCurrentView = loadedViewKeys.has(currentViewKey)
  const hasLoadedAnyView = loadedViewKeys.size > 0
  const hasPreviousPage = pageIndex > 0
  const isSearchMode = debouncedSearchQuery.length > 0
  const totalCount = isSearchMode ? null : (currentTotalCount ?? selectedAlbum?.imageCount ?? 0)
  const totalPages = totalCount === null ? null : Math.max(1, Math.ceil(totalCount / pageSize))
  const isFetching = isImagesFetching || isLastPageResolving || isViewTransitionPending
  const isInitialLoading = !hasLoadedCurrentView && images.length === 0 && (!hasLoadedAnyView || imagesState === 'loading' || isImagesFetching)
  const isPaginationBusy = isFetching

  useEffect(() => {
    selectedAlbumIdRef.current = selectedAlbumId
  }, [selectedAlbumId])

  useEffect(() => {
    pageCursorsRef.current = pageCursors
  }, [pageCursors])

  useEffect(() => {
    loadedViewKeysRef.current = loadedViewKeys
  }, [loadedViewKeys])

  const resetPaging = useCallback(() => {
    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
    setPageCursors([null])
    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
    setPageIndex(0)
    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
    setHasNextPage(false)
    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
    setNextCursor(null)
    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
    setCurrentTotalCount(null)
  }, [])

  const fetchImagesPage = useCallback(async (input: {
    albumId: string
    cursor: string | null
    query: string
    pageSize: number
  }) => {
    return listImagesFn({
      data: {
        albumId: input.albumId,
        cursor: input.cursor,
        pageSize: input.pageSize,
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
    cursor: string | null
    query: string
    pageSize: number
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
      const payload = await fetchImagesPage(input)
      if (requestId !== imageRequestIdRef.current) {
        return
      }

      setImages(payload.items)
      setImageUrlError(payload.imageUrlError ?? null)
      setHasNextPage(payload.hasNextPage)
      setNextCursor(payload.nextCursor)
      setCurrentTotalCount(payload.totalCount ?? null)
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
  }, [fetchImagesPage])

  const refreshAlbum = useCallback(async (albumId: string) => {
    await loadAlbums(albumId)
    resetPaging()
    setImagesReloadToken(token => token + 1)
  }, [loadAlbums, resetPaging])

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
    resetPaging()
  }, [debouncedSearchQuery, pageSize, resetPaging, selectedAlbumId])

  useEffect(() => {
    if (!isAlbumsLoaded || !selectedAlbumId) {
      return
    }

    void loadImages({
      albumId: selectedAlbumId,
      cursor: currentCursor,
      query: debouncedSearchQuery,
      pageSize,
      viewKey: currentViewKey,
    }).catch((error) => {
      toast.error('Failed to load images', {
        description: error instanceof Error ? error.message : String(error),
      })
    })
  }, [currentCursor, currentViewKey, debouncedSearchQuery, imagesReloadToken, isAlbumsLoaded, loadImages, pageSize, selectedAlbumId])

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
    if (isPaginationBusy || !hasNextPage || nextCursor === null) {
      return
    }

    startViewTransition(() => {
      setPageCursors(previous => [...previous.slice(0, pageIndex + 1), nextCursor])
      setPageIndex(previous => previous + 1)
    })
  }, [hasNextPage, isPaginationBusy, nextCursor, pageIndex, startViewTransition])

  const goPrevPage = useCallback(() => {
    if (isPaginationBusy) {
      return
    }
    startViewTransition(() => {
      setPageIndex(previous => Math.max(0, previous - 1))
    })
  }, [isPaginationBusy, startViewTransition])

  const goFirstPage = useCallback(() => {
    if (isPaginationBusy) {
      return
    }
    startViewTransition(() => {
      setPageIndex(0)
    })
  }, [isPaginationBusy, startViewTransition])

  const goLastPage = useCallback(() => {
    if (isPaginationBusy || totalPages === null) {
      return
    }
    const targetIndex = Math.max(0, totalPages - 1)
    if (targetIndex <= pageIndex) {
      startViewTransition(() => {
        setPageIndex(targetIndex)
      })
      return
    }
    if (!selectedAlbumIdRef.current) {
      return
    }

    void (async () => {
      setIsLastPageResolving(true)
      try {
        let cursors = [...pageCursorsRef.current]

        while (cursors.length <= targetIndex) {
          const cursor = cursors.at(-1) ?? null
          const payload = await fetchImagesPage({
            albumId: selectedAlbumIdRef.current,
            cursor,
            query: debouncedSearchQuery,
            pageSize,
          })
          if (!payload.hasNextPage || payload.nextCursor === null) {
            break
          }
          cursors = [...cursors, payload.nextCursor]
        }

        startViewTransition(() => {
          setPageCursors(cursors)
          setPageIndex(Math.min(targetIndex, Math.max(0, cursors.length - 1)))
        })
      }
      catch (error) {
        toast.error('Failed to jump to last page', {
          description: error instanceof Error ? error.message : String(error),
        })
      }
      finally {
        setIsLastPageResolving(false)
      }
    })()
  }, [debouncedSearchQuery, fetchImagesPage, isPaginationBusy, pageIndex, pageSize, startViewTransition, totalPages])

  const onPageSizeChange = useCallback((value: number) => {
    if (!Number.isFinite(value) || value <= 0) {
      return
    }
    startViewTransition(() => {
      setPageSize(Math.trunc(value))
    })
  }, [startViewTransition])

  const onSearchQueryChange = useCallback((value: string) => {
    startViewTransition(() => {
      setSearchQuery(value)
    })
  }, [startViewTransition])

  const selectAlbum = useCallback((albumId: string) => {
    startViewTransition(() => {
      setSelectedAlbumId(albumId)
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
    imagesStatus: {
      state: imagesState,
      isFetching,
      isInitialLoading,
      hasLoadedOnce: hasLoadedCurrentView,
      error: imagesError,
    },
  }
}
