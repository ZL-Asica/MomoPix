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

/**
 * Default client page size for dashboard table pagination.
 */
const DEFAULT_IMAGE_PAGE_SIZE = 50
/**
 * Batch size used while aggregating the full image set from cursor pages.
 */
const IMAGE_FETCH_BATCH_SIZE = 200
/**
 * Delay used before applying search queries to server fetches.
 */
const SEARCH_DEBOUNCE_MS = 250

type ImagesState = 'idle' | 'loading' | 'success' | 'error'

interface ImageViewCacheEntry {
  items: AlbumImageListItem[]
  imageUrlError: string | null
}

/**
 * Central dashboard data orchestration for albums, full image datasets, and mutations.
 *
 * @returns Dashboard datasets, pagination/search state, and mutation handlers.
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
  const [isAlbumsLoaded, setIsAlbumsLoaded] = useState(false)
  const [loadedViewKeys, setLoadedViewKeys] = useState<Set<string>>(() => new Set())
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [renameImageObjectKey, setRenameImageObjectKey] = useState<string | null>(null)
  const [moveImageObjectKey, setMoveImageObjectKey] = useState<string | null>(null)
  const [pendingDeleteObjectKey, setPendingDeleteObjectKey] = useState<string | null>(null)
  const [isViewTransitionPending, startViewTransition] = useTransition()
  const imageRequestIdRef = useRef(0)
  const activeImagesRef = useRef(images)
  const selectedAlbumIdRef = useRef(selectedAlbumId)
  const loadedViewKeysRef = useRef(loadedViewKeys)
  const imageViewsRef = useRef(new Map<string, ImageViewCacheEntry>())

  const albumById = useMemo(() => new Map(albums.map(album => [album.id, album])), [albums])
  const selectedAlbum = albumById.get(selectedAlbumId) ?? null
  const currentViewKey = `${selectedAlbumId}|${debouncedSearchQuery}`
  const activeViewKeyRef = useRef(currentViewKey)
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
    activeImagesRef.current = images
  }, [images])

  useEffect(() => {
    loadedViewKeysRef.current = loadedViewKeys
  }, [loadedViewKeys])

  useEffect(() => {
    activeViewKeyRef.current = currentViewKey
  }, [currentViewKey])

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
    const cached = imageViewsRef.current.get(input.viewKey)
    if (cached !== undefined) {
      activeImagesRef.current = cached.items
      setImages(cached.items)
      setImageUrlError(cached.imageUrlError)
      setImagesError(null)
      setImagesState('success')
      setIsImagesFetching(false)
      return
    }

    const hadLoadedView = loadedViewKeysRef.current.has(input.viewKey)

    setIsImagesFetching(true)
    setImagesError(null)
    if (!hadLoadedView) {
      activeImagesRef.current = []
      setImages([])
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
      activeImagesRef.current = items
      setImages(items)
      setImageUrlError(viewImageUrlError)
      setImagesState('success')
      imageViewsRef.current.set(input.viewKey, {
        items,
        imageUrlError: viewImageUrlError,
      })
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

  const updateImageView = useCallback((input: {
    viewKey: string
    updater: (items: AlbumImageListItem[]) => AlbumImageListItem[]
    clampPage?: boolean
  }) => {
    const cached = imageViewsRef.current.get(input.viewKey)
    if (cached !== undefined) {
      imageViewsRef.current.set(input.viewKey, {
        ...cached,
        items: input.updater(cached.items),
      })
    }

    if (activeViewKeyRef.current === input.viewKey) {
      const next = input.updater(activeImagesRef.current)
      activeImagesRef.current = next
      setImages(next)
      if (input.clampPage) {
        const lastPageIndex = Math.max(0, Math.ceil(next.length / pageSize) - 1)
        setPageIndex(current => Math.min(current, lastPageIndex))
      }
    }
  }, [pageSize])

  const removeImagesFromCachedViews = useCallback((input: {
    objectKeys: readonly string[]
    viewKey: string
  }) => {
    const keys = new Set(input.objectKeys)
    for (const [viewKey, cached] of imageViewsRef.current) {
      imageViewsRef.current.set(viewKey, {
        ...cached,
        items: cached.items.filter(image => !keys.has(image.objectKey)),
      })
    }
    updateImageView({
      viewKey: input.viewKey,
      updater: images => images.filter(image => !keys.has(image.objectKey)),
      clampPage: true,
    })
  }, [updateImageView])

  const invalidateInactiveImageViews = useCallback(() => {
    const activeViewKey = activeViewKeyRef.current
    for (const viewKey of imageViewsRef.current.keys()) {
      if (viewKey !== activeViewKey) {
        imageViewsRef.current.delete(viewKey)
      }
    }
    setLoadedViewKeys(previous => new Set([...previous].filter(viewKey => viewKey === activeViewKey)))
  }, [])

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

  const { isUploading, uploadFiles } = useUpload({
    selectedAlbumId,
    onUploaded: (uploaded) => {
      const uploadViewKey = currentViewKey
      invalidateInactiveImageViews()
      const matching = uploaded
        .filter(({ albumImage }) => albumImage.albumId === selectedAlbumId)
        .map(({ albumImage, publicUrl }) => ({ ...albumImage, publicUrl }))
        .filter(image => debouncedSearchQuery.length === 0 || image.nameLower.includes(debouncedSearchQuery.toLowerCase()))

      if (matching.length > 0) {
        updateImageView({
          viewKey: uploadViewKey,
          updater: images => [...matching, ...images],
        })
      }

      const usage = new Map<string, { imageCount: number, bytesUsed: number }>()
      for (const { albumImage } of uploaded) {
        const current = usage.get(albumImage.albumId) ?? { imageCount: 0, bytesUsed: 0 }
        current.imageCount += 1
        current.bytesUsed += albumImage.sizeBytes
        usage.set(albumImage.albumId, current)
      }
      updateAlbumUsage(usage)
      setMeta(previous => previous === null
        ? previous
        : {
            ...previous,
            totalImageCount: previous.totalImageCount + uploaded.length,
            totalBytesUsed: previous.totalBytesUsed + uploaded.reduce((total, { albumImage }) => total + albumImage.sizeBytes, 0),
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
  }, [currentViewKey, debouncedSearchQuery, isAlbumsLoaded, loadImages, selectedAlbumId])

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
    toast.success('Album created')
  }, [])

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

  const moveImage = useCallback(async ({ objectKey, targetAlbumId }: MoveImageInput) => {
    const viewKey = currentViewKey
    const sourceImage = images.find(image => image.objectKey === objectKey)
    await moveImageFn({
      data: {
        objectKey,
        targetAlbumId,
      },
    })

    if (sourceImage !== undefined && sourceImage.albumId !== targetAlbumId) {
      removeImagesFromCachedViews({ objectKeys: [objectKey], viewKey })
      invalidateInactiveImageViews()
      updateAlbumUsage(new Map([
        [sourceImage.albumId, { imageCount: -1, bytesUsed: -sourceImage.sizeBytes }],
        [targetAlbumId, { imageCount: 1, bytesUsed: sourceImage.sizeBytes }],
      ]))
    }
    setMoveImageObjectKey(null)
    toast.success('Image moved')
  }, [currentViewKey, images, invalidateInactiveImageViews, removeImagesFromCachedViews, updateAlbumUsage])

  const renameImage = useCallback(async ({ objectKey, name }: RenameImageInput) => {
    const viewKey = currentViewKey
    const query = debouncedSearchQuery.toLowerCase()
    const payload = await renameImageFn({
      data: {
        objectKey,
        name: name.trim(),
      },
    })
    updateImageView({
      viewKey,
      updater: images => images.flatMap((image) => {
        if (image.objectKey !== objectKey) {
          return [image]
        }
        const renamed = {
          ...image,
          name: payload.image.name,
          nameLower: payload.image.name.toLowerCase(),
        }
        return query.length === 0 || renamed.nameLower.includes(query) ? [renamed] : []
      }),
      clampPage: true,
    })
    invalidateInactiveImageViews()
    setRenameImageObjectKey(null)
    toast.success('Image renamed')
  }, [currentViewKey, debouncedSearchQuery, invalidateInactiveImageViews, updateImageView])

  const deleteImage = useCallback(async (objectKey: string) => {
    const viewKey = currentViewKey
    const payload = await deleteImageFn({ data: { objectKey } })
    removeImagesFromCachedViews({ objectKeys: [objectKey], viewKey })
    invalidateInactiveImageViews()
    updateAlbumUsage(new Map([[
      payload.image.albumId,
      { imageCount: -1, bytesUsed: -payload.image.sizeBytes },
    ]]))
    setMeta(previous => previous === null
      ? previous
      : {
          ...previous,
          totalImageCount: Math.max(0, previous.totalImageCount - 1),
          totalBytesUsed: Math.max(0, previous.totalBytesUsed - payload.image.sizeBytes),
          updatedAt: new Date().toISOString(),
        })
    setPendingDeleteObjectKey(null)
    toast.success('Image deleted')
  }, [currentViewKey, invalidateInactiveImageViews, removeImagesFromCachedViews, updateAlbumUsage])

  const bulkMoveImages = useCallback(async ({ objectKeys, targetAlbumId }: BulkMoveImagesInput): Promise<BulkOperationResult> => {
    const viewKey = currentViewKey
    const result = await moveImagesFn({
      data: {
        objectKeys,
        targetAlbumId,
      },
    })
    const sourceImages = images.filter(image => result.succeededObjectKeys.includes(image.objectKey))
    if (targetAlbumId !== selectedAlbumId && sourceImages.length > 0) {
      removeImagesFromCachedViews({ objectKeys: result.succeededObjectKeys, viewKey })
      invalidateInactiveImageViews()
      const bytesUsed = sourceImages.reduce((total, image) => total + image.sizeBytes, 0)
      updateAlbumUsage(new Map([
        [selectedAlbumId, { imageCount: -sourceImages.length, bytesUsed: -bytesUsed }],
        [targetAlbumId, { imageCount: sourceImages.length, bytesUsed }],
      ]))
    }

    return result
  }, [currentViewKey, images, invalidateInactiveImageViews, removeImagesFromCachedViews, selectedAlbumId, updateAlbumUsage])

  const bulkDeleteImages = useCallback(async (objectKeys: string[]): Promise<BulkOperationResult> => {
    const viewKey = currentViewKey
    const result = await deleteImagesFn({
      data: {
        objectKeys,
      },
    })
    const deletedImages = images.filter(image => result.succeededObjectKeys.includes(image.objectKey))
    removeImagesFromCachedViews({ objectKeys: result.succeededObjectKeys, viewKey })
    invalidateInactiveImageViews()
    if (deletedImages.length > 0) {
      const bytesUsed = deletedImages.reduce((total, image) => total + image.sizeBytes, 0)
      updateAlbumUsage(new Map([[
        selectedAlbumId,
        { imageCount: -deletedImages.length, bytesUsed: -bytesUsed },
      ]]))
      setMeta(previous => previous === null
        ? previous
        : {
            ...previous,
            totalImageCount: Math.max(0, previous.totalImageCount - deletedImages.length),
            totalBytesUsed: Math.max(0, previous.totalBytesUsed - bytesUsed),
            updatedAt: new Date().toISOString(),
          })
    }

    return result
  }, [currentViewKey, images, invalidateInactiveImageViews, removeImagesFromCachedViews, selectedAlbumId, updateAlbumUsage])

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
