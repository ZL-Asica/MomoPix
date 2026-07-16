import type { DashboardUrlState } from '@/features/dashboard/lib/urlState'
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
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useUpload } from '@/features/dashboard/hooks/useUpload'
import { getCursorNavigationStart } from '@/features/dashboard/lib/cursorNavigation'
import { normalizeDashboardQuery } from '@/features/dashboard/lib/urlState'
import { createAlbumFn, deleteAlbumFn, listAlbumsFn, moveAlbumFn, renameAlbumFn, setDefaultAlbumFn } from '@/functions/albums'
import { deleteImageFn, deleteImagesFn, listImagesFn, moveImageFn, moveImagesFn, renameImageFn } from '@/functions/images'
import { ROOT_ALBUM_ID } from '@/lib/storage/types'

/**
 * Default client page size for dashboard table pagination.
 */
const DEFAULT_IMAGE_PAGE_SIZE = 50
/**
 * Delay used before applying search queries to server fetches.
 */
const SEARCH_DEBOUNCE_MS = 250
/**
 * Largest page number accepted from a search deep link before requiring normal Next navigation.
 */
const MAX_SEARCH_DEEP_LINK_PAGE_INDEX = 20

type LoadState = 'idle' | 'loading' | 'success' | 'error'

interface UseDashboardDataOptions {
  urlState: DashboardUrlState
  onUrlStateChange: (next: Partial<DashboardUrlState>, replace?: boolean) => void
}

/**
 * Central dashboard data orchestration for albums, cursor-paged image data, and mutations.
 *
 * @returns Dashboard datasets, pagination/search state, and mutation handlers.
 */
export function useDashboardData(options: UseDashboardDataOptions) {
  const { onUrlStateChange, urlState } = options
  const urlAlbumId = urlState.album ?? ROOT_ALBUM_ID
  const urlQuery = normalizeDashboardQuery(urlState.q ?? '') ?? ''
  const urlPageIndex = urlState.page - 1
  const urlPageSize = urlState.pageSize
  const [albums, setAlbums] = useState<AlbumRecord[]>([])
  const [meta, setMeta] = useState<StorageMeta | null>(null)
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>(urlAlbumId)
  const [images, setImages] = useState<AlbumImageListItem[]>([])
  const [imageUrlError, setImageUrlError] = useState<string | null>(null)
  const [imagesState, setImagesState] = useState<LoadState>('idle')
  const [albumsState, setAlbumsState] = useState<LoadState>('idle')
  const [isImagesFetching, setIsImagesFetching] = useState(false)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [pageIndex, setPageIndex] = useState(urlPageIndex)
  const pageIndexRef = useRef(pageIndex)
  const [imagesRevision, setImagesRevision] = useState(0)
  const [pageSize, setPageSize] = useState(urlPageSize ?? DEFAULT_IMAGE_PAGE_SIZE)
  const [searchQuery, setSearchQuery] = useState(urlQuery)
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(urlQuery)
  const [isAlbumsLoaded, setIsAlbumsLoaded] = useState(false)
  const [loadedPageKey, setLoadedPageKey] = useState<string | null>(null)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [renameImageObjectKey, setRenameImageObjectKey] = useState<string | null>(null)
  const [moveImageObjectKey, setMoveImageObjectKey] = useState<string | null>(null)
  const [pendingDeleteObjectKey, setPendingDeleteObjectKey] = useState<string | null>(null)
  const [pendingDeleteAlbumId, setPendingDeleteAlbumId] = useState<string | null>(null)
  const [isViewTransitionPending, startViewTransition] = useTransition()
  const imageRequestIdRef = useRef(0)
  const selectedAlbumIdRef = useRef(selectedAlbumId)
  const cursorByViewRef = useRef(new Map<string, Map<number, string | null>>())

  const albumById = useMemo(() => new Map(albums.map(album => [album.id, album])), [albums])
  const selectedAlbum = albumById.get(selectedAlbumId) ?? null
  const currentViewKey = `${selectedAlbumId}|${debouncedSearchQuery}|${pageSize}|${imagesRevision}`
  const currentPageKey = `${currentViewKey}|${pageIndex}`
  const hasLoadedCurrentPage = loadedPageKey === currentPageKey
  const hasLoadedAnyPage = loadedPageKey !== null
  const isSearchMode = debouncedSearchQuery.length > 0
  const totalCount = isSearchMode ? null : (selectedAlbum?.imageCount ?? 0)
  const totalPages = totalCount === null ? null : Math.max(1, Math.ceil(totalCount / pageSize))
  const hasPreviousPage = pageIndex > 0
  const isFetching = isImagesFetching || isViewTransitionPending
  const isInitialLoading = imagesState !== 'error'
    && !hasLoadedCurrentPage
    && images.length === 0
    && (!hasLoadedAnyPage || imagesState === 'loading' || isImagesFetching)
  const isPaginationBusy = isFetching

  useLayoutEffect(() => {
    // Browser history is external state; retain local state for immediate transitions while reconciling Back/Forward navigation.
    /* eslint-disable react/set-state-in-effect -- synchronizing browser history state */
    setSelectedAlbumId(current => current === urlAlbumId ? current : urlAlbumId)
    setSearchQuery(current => current === urlQuery ? current : urlQuery)
    setPageIndex(current => current === urlPageIndex ? current : urlPageIndex)
    pageIndexRef.current = urlPageIndex
    setPageSize(current => current === urlPageSize ? current : urlPageSize)
    /* eslint-enable react/set-state-in-effect */
  }, [urlAlbumId, urlPageIndex, urlPageSize, urlQuery])

  useLayoutEffect(() => {
    selectedAlbumIdRef.current = selectedAlbumId
  }, [selectedAlbumId])

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
    if (finalSelected !== selectedCandidate) {
      onUrlStateChange({ album: finalSelected, page: 1 }, true)
    }

    return finalSelected
  }, [onUrlStateChange])

  const loadImages = useCallback(async (input: {
    albumId: string
    query: string
    viewKey: string
    pageIndex: number
  }) => {
    const maximumPageIndex = isSearchMode
      ? MAX_SEARCH_DEEP_LINK_PAGE_INDEX
      : (totalPages === null ? null : totalPages - 1)
    if (maximumPageIndex !== null && input.pageIndex > maximumPageIndex) {
      pageIndexRef.current = maximumPageIndex
      setPageIndex(maximumPageIndex)
      onUrlStateChange({ page: maximumPageIndex + 1 }, true)
      return
    }

    const requestId = imageRequestIdRef.current + 1
    imageRequestIdRef.current = requestId

    setIsImagesFetching(true)
    setImages([])
    setImagesState('loading')

    try {
      const cursorByPage = cursorByViewRef.current.get(input.viewKey) ?? new Map([[0, null]])
      cursorByViewRef.current.set(input.viewKey, cursorByPage)
      const cursorStart = getCursorNavigationStart(cursorByPage, input.pageIndex)
      let resolvedPageIndex = cursorStart.pageIndex
      let cursor = cursorStart.cursor

      let payload
      while (resolvedPageIndex < input.pageIndex) {
        payload = await fetchImagesPage({
          albumId: input.albumId,
          cursor,
          query: input.query,
          pageSize,
        })

        if (requestId !== imageRequestIdRef.current) {
          return
        }

        if (!payload.hasNextPage || payload.nextCursor === null) {
          setImages(payload.items)
          setHasNextPage(false)
          setImageUrlError(payload.imageUrlError)
          setImagesState('success')
          setLoadedPageKey(`${input.viewKey}|${resolvedPageIndex}`)
          pageIndexRef.current = resolvedPageIndex
          setPageIndex(resolvedPageIndex)
          onUrlStateChange({ page: resolvedPageIndex + 1 }, true)
          return
        }

        cursor = payload.nextCursor
        resolvedPageIndex += 1
        cursorByPage.set(resolvedPageIndex, cursor)
      }

      payload = await fetchImagesPage({
        albumId: input.albumId,
        cursor: cursor ?? null,
        query: input.query,
        pageSize,
      })

      if (requestId !== imageRequestIdRef.current) {
        return
      }

      if (payload.items.length === 0 && input.pageIndex > 0) {
        const previousPageIndex = input.pageIndex - 1
        pageIndexRef.current = previousPageIndex
        setPageIndex(previousPageIndex)
        onUrlStateChange({ page: previousPageIndex + 1 }, true)
        return
      }

      if (payload.hasNextPage && payload.nextCursor !== null) {
        cursorByPage.set(input.pageIndex + 1, payload.nextCursor)
      }
      setImages(payload.items)
      setHasNextPage(payload.hasNextPage)
      setImageUrlError(payload.imageUrlError)
      setImagesState('success')
      setLoadedPageKey(`${input.viewKey}|${input.pageIndex}`)
    }
    catch {
      if (requestId !== imageRequestIdRef.current) {
        return
      }
      setImagesState('error')
    }
    finally {
      if (requestId === imageRequestIdRef.current) {
        setIsImagesFetching(false)
      }
    }
  }, [fetchImagesPage, isSearchMode, onUrlStateChange, pageSize, totalPages])

  const refreshImages = useCallback(() => {
    imageRequestIdRef.current += 1
    cursorByViewRef.current.clear()
    setLoadedPageKey(null)
    setHasNextPage(false)
    setImagesRevision(previous => previous + 1)
  }, [])

  const reloadAlbums = useCallback(async () => {
    setAlbumsState('loading')
    setIsAlbumsLoaded(false)
    try {
      await loadAlbums()
      setAlbumsState('success')
      setIsAlbumsLoaded(true)
    }
    catch {
      setAlbumsState('error')
    }
  }, [loadAlbums])

  const updateAlbumUsage = useCallback((changes: Map<string, { imageCount: number, bytesUsed: number }>) => {
    setAlbums(previous => previous.map((album) => {
      const change = changes.get(album.id)
      if (change === undefined) {
        return album
      }
      return {
        ...album,
        imageCount: Math.max(0, album.imageCount + change.imageCount),
        bytesUsed: Math.max(0, album.bytesUsed + change.bytesUsed),
      }
    }))
  }, [])

  const {
    isUploading,
    uploadProgress,
    failedUploadCount,
    uploadFiles,
    retryFailedUploads,
  } = useUpload({
    selectedAlbumId,
    onUploaded: (uploaded) => {
      refreshImages()

      const usage = new Map<string, { imageCount: number, bytesUsed: number }>()
      for (const { albumImage } of uploaded) {
        const current = usage.get(albumImage.albumId) ?? { imageCount: 0, bytesUsed: 0 }
        current.imageCount += 1
        current.bytesUsed += albumImage.storageBytes
        usage.set(albumImage.albumId, current)
      }
      updateAlbumUsage(usage)
      setMeta(previous => previous === null
        ? previous
        : {
            ...previous,
            totalImageCount: previous.totalImageCount + uploaded.length,
            totalBytesUsed: previous.totalBytesUsed + uploaded.reduce((total, { albumImage }) => total + albumImage.storageBytes, 0),
            updatedAt: new Date().toISOString(),
          })
    },
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
    void reloadAlbums()
  }, [reloadAlbums])

  useEffect(() => {
    if (!isAlbumsLoaded || !selectedAlbumId) {
      return
    }
    if (loadedPageKey === currentPageKey) {
      return
    }

    void loadImages({
      albumId: selectedAlbumId,
      query: debouncedSearchQuery,
      viewKey: currentViewKey,
      pageIndex,
    })
  }, [currentPageKey, currentViewKey, debouncedSearchQuery, isAlbumsLoaded, loadedPageKey, loadImages, pageIndex, selectedAlbumId])

  const createAlbum = useCallback(async ({ name, parentId }: CreateAlbumInput) => {
    const payload = await createAlbumFn({
      data: {
        name: name.trim(),
        parentId,
      },
    })

    setAlbums(payload.albums)
    setMeta(payload.meta)
    setSelectedAlbumId(payload.album.id)
    setPageIndex(0)
    pageIndexRef.current = 0
    onUrlStateChange({ album: payload.album.id, page: 1 })
    toast.success('Album created')
  }, [onUrlStateChange])

  const renameAlbum = useCallback(async ({ albumId, name }: RenameAlbumInput) => {
    const payload = await renameAlbumFn({
      data: {
        albumId,
        name: name.trim(),
      },
    })

    setAlbums(payload.albums)
    setMeta(payload.meta)
    toast.success('Album renamed')
  }, [])

  const moveAlbum = useCallback(async ({ albumId, parentId }: MoveAlbumInput) => {
    const payload = await moveAlbumFn({
      data: {
        albumId,
        parentId,
      },
    })

    setAlbums(payload.albums)
    setMeta(payload.meta)
    toast.success('Album moved')
  }, [])

  const setDefaultAlbum = useCallback(async (albumId: string) => {
    const payload = await setDefaultAlbumFn({ data: { albumId } })
    setMeta(payload.meta)
    toast.success('Default album updated')
  }, [])

  const deleteAlbum = useCallback(async (input: { albumId: string, targetAlbumId: string }) => {
    const payload = await deleteAlbumFn({ data: input })
    setAlbums(payload.albums)
    setMeta(payload.meta)
    imageRequestIdRef.current += 1
    refreshImages()
    setPendingDeleteAlbumId(null)
    if (selectedAlbumIdRef.current === payload.deletedAlbumId) {
      setSelectedAlbumId(payload.targetAlbumId)
      setPageIndex(0)
      pageIndexRef.current = 0
      onUrlStateChange({ album: payload.targetAlbumId, page: 1 }, true)
    }
    toast.success('Album deleted and contents moved')
  }, [onUrlStateChange, refreshImages])

  const moveImage = useCallback(async ({ objectKey, targetAlbumId }: MoveImageInput) => {
    const sourceImage = images.find(image => image.objectKey === objectKey)
    await moveImageFn({
      data: {
        objectKey,
        targetAlbumId,
      },
    })

    refreshImages()
    if (sourceImage !== undefined && sourceImage.albumId !== targetAlbumId) {
      updateAlbumUsage(new Map([
        [sourceImage.albumId, { imageCount: -1, bytesUsed: -sourceImage.storageBytes }],
        [targetAlbumId, { imageCount: 1, bytesUsed: sourceImage.storageBytes }],
      ]))
    }
    setMoveImageObjectKey(null)
    toast.success('Image moved')
  }, [images, refreshImages, updateAlbumUsage])

  const renameImage = useCallback(async ({ objectKey, name }: RenameImageInput) => {
    await renameImageFn({
      data: {
        objectKey,
        name: name.trim(),
      },
    })
    refreshImages()
    setRenameImageObjectKey(null)
    toast.success('Image renamed')
  }, [refreshImages])

  const deleteImage = useCallback(async (objectKey: string) => {
    const payload = await deleteImageFn({ data: { objectKey } })
    refreshImages()
    updateAlbumUsage(new Map([[
      payload.image.albumId,
      {
        imageCount: -1,
        bytesUsed: -(
          payload.image.sizeBytes
          + (payload.image.thumbnail?.sizeBytes ?? 0)
          + (payload.image.original?.sizeBytes ?? 0)
        ),
      },
    ]]))
    const storageBytes = payload.image.sizeBytes
      + (payload.image.thumbnail?.sizeBytes ?? 0)
      + (payload.image.original?.sizeBytes ?? 0)
    setMeta(previous => previous === null
      ? previous
      : {
          ...previous,
          totalImageCount: Math.max(0, previous.totalImageCount - 1),
          totalBytesUsed: payload.cleanupPending
            ? previous.totalBytesUsed
            : Math.max(0, previous.totalBytesUsed - storageBytes),
          updatedAt: new Date().toISOString(),
        })
    setPendingDeleteObjectKey(null)
    if (payload.cleanupPending) {
      toast.warning('Image hidden; storage cleanup will retry automatically')
    }
    else {
      toast.success('Image deleted')
    }
  }, [refreshImages, updateAlbumUsage])

  const bulkMoveImages = useCallback(async ({ objectKeys, targetAlbumId }: BulkMoveImagesInput): Promise<BulkOperationResult> => {
    const result = await moveImagesFn({
      data: {
        objectKeys,
        targetAlbumId,
      },
    })
    const sourceImages = images.filter(image => result.succeededObjectKeys.includes(image.objectKey))
    if (result.succeededObjectKeys.length > 0) {
      refreshImages()
    }
    if (targetAlbumId !== selectedAlbumId && sourceImages.length > 0) {
      const bytesUsed = sourceImages.reduce((total, image) => total + image.storageBytes, 0)
      updateAlbumUsage(new Map([
        [selectedAlbumId, { imageCount: -sourceImages.length, bytesUsed: -bytesUsed }],
        [targetAlbumId, { imageCount: sourceImages.length, bytesUsed }],
      ]))
    }

    return result
  }, [images, refreshImages, selectedAlbumId, updateAlbumUsage])

  const bulkDeleteImages = useCallback(async (objectKeys: string[]): Promise<BulkOperationResult> => {
    const result = await deleteImagesFn({
      data: {
        objectKeys,
      },
    })
    const deletedImages = images.filter(image => result.succeededObjectKeys.includes(image.objectKey))
    if (result.succeededObjectKeys.length > 0) {
      refreshImages()
    }
    const cleanedImages = deletedImages.filter(image => !result.cleanupPendingObjectKeys.includes(image.objectKey))
    if (deletedImages.length > 0) {
      const albumBytesUsed = deletedImages.reduce((total, image) => total + image.storageBytes, 0)
      const releasedBytes = cleanedImages.reduce((total, image) => total + image.storageBytes, 0)
      updateAlbumUsage(new Map([[
        selectedAlbumId,
        { imageCount: -deletedImages.length, bytesUsed: -albumBytesUsed },
      ]]))
      setMeta(previous => previous === null
        ? previous
        : {
            ...previous,
            totalImageCount: Math.max(0, previous.totalImageCount - deletedImages.length),
            totalBytesUsed: Math.max(0, previous.totalBytesUsed - releasedBytes),
            updatedAt: new Date().toISOString(),
          })
    }

    if (result.cleanupPendingObjectKeys.length > 0) {
      toast.warning(`${result.cleanupPendingObjectKeys.length} image cleanup(s) will retry automatically`)
    }

    return result
  }, [images, refreshImages, selectedAlbumId, updateAlbumUsage])

  const goNextPage = useCallback(() => {
    const nextIndex = pageIndexRef.current + 1
    if (isPaginationBusy || !hasNextPage) {
      return
    }

    pageIndexRef.current = nextIndex
    startViewTransition(() => {
      setPageIndex(nextIndex)
    })
    onUrlStateChange({ page: nextIndex + 1 })
  }, [hasNextPage, isPaginationBusy, onUrlStateChange, startViewTransition])

  const goPrevPage = useCallback(() => {
    const nextIndex = Math.max(0, pageIndexRef.current - 1)
    if (isPaginationBusy || !hasPreviousPage) {
      return
    }
    pageIndexRef.current = nextIndex
    startViewTransition(() => {
      setPageIndex(nextIndex)
    })
    onUrlStateChange({ page: nextIndex + 1 })
  }, [hasPreviousPage, isPaginationBusy, onUrlStateChange, startViewTransition])

  const onPageSizeChange = useCallback((value: number) => {
    if (!Number.isFinite(value) || value <= 0) {
      return
    }
    pageIndexRef.current = 0
    startViewTransition(() => {
      setPageSize(Math.trunc(value))
      setPageIndex(0)
    })
    onUrlStateChange({ page: 1, pageSize: Math.trunc(value) })
  }, [onUrlStateChange, startViewTransition])

  const onSearchQueryChange = useCallback((value: string) => {
    pageIndexRef.current = 0
    startViewTransition(() => {
      setSearchQuery(value)
      setPageIndex(0)
    })
    onUrlStateChange({ page: 1, q: normalizeDashboardQuery(value) }, true)
  }, [onUrlStateChange, startViewTransition])

  const selectAlbum = useCallback((albumId: string) => {
    pageIndexRef.current = 0
    startViewTransition(() => {
      setSelectedAlbumId(albumId)
      setPageIndex(0)
    })
    onUrlStateChange({ album: albumId, page: 1 })
  }, [onUrlStateChange, startViewTransition])

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
    pendingDeleteAlbumId,
    setPendingDeleteAlbumId,
    isUploading,
    uploadProgress,
    failedUploadCount,
    uploadFiles,
    retryFailedUploads,
    reloadAlbums,
    retryImages: refreshImages,
    createAlbum,
    renameAlbum,
    moveAlbum,
    renameImage,
    moveImage,
    deleteImage,
    bulkMoveImages,
    bulkDeleteImages,
    setDefaultAlbum,
    deleteAlbum,
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
    onPageSizeChange,
    imagesStatus: {
      state: imagesState,
      isFetching,
      isInitialLoading,
      hasLoadedOnce: hasLoadedCurrentPage,
    },
    albumsStatus: {
      state: albumsState,
      isLoading: albumsState === 'loading',
    },
  }
}
