import type {
  HomeProcessedItem,
  UploadState,
  UploadSummary,
} from '@/features/home/types'
import type { AlbumRecord } from '@/lib/storage/types'
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  useCallback,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import { toast } from 'sonner'
import { listAlbumsFn } from '@/functions/albums'
import { uploadImageFn } from '@/functions/images'
import { runBulkOperation } from '@/lib/bulk'

const UPLOAD_CONCURRENCY = 3
const UPLOAD_TIMEOUT_MS = 45_000

const EMPTY_ALBUMS: AlbumRecord[] = []

/**
 * Centralized query keys.
 *
 * Reuse these keys anywhere else that reads albums or images so mutations can
 * invalidate the correct cached data.
 */
export const albumQueryKeys = {
  all: ['albums'] as const,
  list: () => [...albumQueryKeys.all, 'list'] as const,
}

export const imageQueryKeys = {
  all: ['images'] as const,
}

interface UploadImageResponse {
  image: {
    objectKey: string
    albumId: string
  }
  publicUrl: string | null
}

interface UseUploadSelectedInput {
  /** Whether account-bound album and upload operations are available. */
  enabled: boolean
  items: readonly HomeProcessedItem[]
  selectedIds: ReadonlySet<string>
  patchItem: (
    id: string,
    patch: Partial<HomeProcessedItem>,
  ) => void

  /**
   * Removes only the specified items from the current selection.
   *
   * This is intentionally more precise than clearSelection(), because a
   * selection can contain items that were not eligible for upload.
   */
  removeSelection: (ids: readonly string[]) => void
}

interface UploadProgress {
  state: UploadState
  summary: UploadSummary
}

type UploadProgressAction
  = | {
    type: 'reset'
  }
  | {
    type: 'start'
    total: number
  }
  | {
    type: 'item-succeeded'
  }
  | {
    type: 'item-failed'
  }
  | {
    type: 'finish'
    succeeded: number
    failed: number
  }
  | {
    type: 'fatal-error'
  }

interface UploadMutationVariables {
  albumId: string
  candidates: readonly HomeProcessedItem[]
}

interface UploadMutationResult {
  total: number
  succeeded: number
  failed: number
  succeededIds: string[]
}

const INITIAL_UPLOAD_PROGRESS: UploadProgress = {
  state: 'idle',
  summary: {
    total: 0,
    succeeded: 0,
    failed: 0,
  },
}

function uploadProgressReducer(
  current: UploadProgress,
  action: UploadProgressAction,
): UploadProgress {
  switch (action.type) {
    case 'reset':
      return INITIAL_UPLOAD_PROGRESS

    case 'start':
      return {
        state: 'uploading',
        summary: {
          total: action.total,
          succeeded: 0,
          failed: 0,
        },
      }

    case 'item-succeeded':
      return {
        ...current,
        summary: {
          ...current.summary,
          succeeded: current.summary.succeeded + 1,
        },
      }

    case 'item-failed':
      return {
        ...current,
        summary: {
          ...current.summary,
          failed: current.summary.failed + 1,
        },
      }

    case 'finish':
      return {
        state: action.failed === 0 ? 'success' : 'error',
        summary: {
          total: action.succeeded + action.failed,
          succeeded: action.succeeded,
          failed: action.failed,
        },
      }

    case 'fatal-error':
      return {
        ...current,
        state: 'error',
      }

    default:
      return current
  }
}

/**
 * Handles album loading and selected-image uploads.
 *
 * This hook should only be mounted while account-bound upload functionality
 * is enabled. Unmounting the consuming component naturally resets all local
 * dialog and upload state.
 */
export function useUploadSelected(
  input: UseUploadSelectedInput,
) {
  const {
    enabled,
    items,
    selectedIds,
    patchItem,
    removeSelection,
  } = input

  const queryClient = useQueryClient()

  // eslint-disable-next-line react/use-state
  const [uploadDialogOpen, setUploadDialogOpenState] = useState(false)

  /**
   * Stores only an explicit user selection.
   *
   * When empty or invalid, selectedAlbumId falls back to the account's current
   * default album without requiring an effect to synchronize state.
   */
  const [
    selectedAlbumOverride,
    setSelectedAlbumOverride,
  ] = useState('')

  const [uploadProgress, dispatchUploadProgress] = useReducer(
    uploadProgressReducer,
    INITIAL_UPLOAD_PROGRESS,
  )
  const isUploadStartingRef = useRef(false)

  const albumsQuery = useQuery({
    queryKey: albumQueryKeys.list(),
    queryFn: async () => listAlbumsFn(),
    enabled,
    staleTime: 60_000,
    retry: 1,
  })

  const albums = albumsQuery.data?.albums ?? EMPTY_ALBUMS

  const defaultAlbumId
    = albumsQuery.data?.meta.defaultAlbumId ?? null

  const selectedAlbumId = useMemo(() => {
    const overrideExists = albums.some(
      album => album.id === selectedAlbumOverride,
    )

    if (overrideExists) {
      return selectedAlbumOverride
    }

    return defaultAlbumId ?? ''
  }, [
    albums,
    defaultAlbumId,
    selectedAlbumOverride,
  ])

  const uploadCandidates = useMemo(() => {
    return items.filter(item => (
      selectedIds.has(item.id)
      && (item.status === 'compressed' || item.status === 'original')
      && item.outputFile !== null
      && item.uploadStatus !== 'uploaded'
    ))
  }, [items, selectedIds])

  const uploadMutation = useMutation({
    mutationKey: ['images', 'bulk-upload'],

    onMutate: ({ candidates }: UploadMutationVariables) => {
      dispatchUploadProgress({
        type: 'start',
        total: candidates.length,
      })

      for (const item of candidates) {
        patchItem(item.id, {
          uploadStatus: 'uploading',
          uploadError: null,
        })
      }
    },

    mutationFn: async ({
      albumId,
      candidates,
    }: UploadMutationVariables): Promise<UploadMutationResult> => {
      const succeededIds: string[] = []

      const result = await runBulkOperation(
        candidates,
        async (item) => {
          try {
            const file = item.outputFile

            if (!file) {
              throw new Error('Missing processed output file')
            }

            const formData = new FormData()
            formData.set('file', file)
            formData.set('albumId', albumId)
            formData.set('source', 'index-compressed')
            formData.set('originalName', item.originalName)

            if (
              item.width !== null
              && item.height !== null
            ) {
              formData.set('width', String(item.width))
              formData.set('height', String(item.height))
            }

            const payload = await uploadImageFn({
              data: formData,
            }) as UploadImageResponse

            succeededIds.push(item.id)

            patchItem(item.id, {
              uploadStatus: 'uploaded',
              uploadError: null,
              uploadedObjectKey: payload.image.objectKey,
              uploadedAlbumId: payload.image.albumId,
              uploadedUrl: payload.publicUrl,
            })

            dispatchUploadProgress({
              type: 'item-succeeded',
            })

            return payload
          }
          catch (error) {
            const message = error instanceof Error
              ? error.message
              : String(error)

            patchItem(item.id, {
              uploadStatus: 'error',
              uploadError: message,
            })

            dispatchUploadProgress({
              type: 'item-failed',
            })

            throw error
          }
        },
        {
          concurrency: UPLOAD_CONCURRENCY,
          timeoutMs: UPLOAD_TIMEOUT_MS,
        },
      )

      return {
        total: candidates.length,
        succeeded: result.ok.length,
        failed: result.failed.length,
        succeededIds,
      }
    },

    onSuccess: (result) => {
      dispatchUploadProgress({
        type: 'finish',
        succeeded: result.succeeded,
        failed: result.failed,
      })

      if (result.succeededIds.length > 0) {
        removeSelection(result.succeededIds)
      }

      /*
       * Uploads can affect album image counts, covers, and image listings.
       * These calls are harmless when no active query currently matches.
       */
      void Promise.all([
        queryClient.invalidateQueries({
          queryKey: albumQueryKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: imageQueryKeys.all,
        }),
      ])

      if (result.failed === 0) {
        setUploadDialogOpenState(false)

        toast.success(
          `Uploaded ${result.succeeded} image(s)`,
        )

        return
      }

      toast.error(
        `Uploaded ${result.succeeded} image(s), ${result.failed} failed`,
      )
    },

    onError: (error) => {
      dispatchUploadProgress({
        type: 'fatal-error',
      })

      toast.error('Upload failed', {
        description: error instanceof Error
          ? error.message
          : String(error),
      })
    },

    onSettled: () => {
      isUploadStartingRef.current = false
    },
  })

  const setUploadDialogOpen = useCallback(
    (open: boolean) => {
      /*
       * Do not allow the user to dismiss the dialog while the active batch is
       * still writing item state.
       */
      if (!open && (isUploadStartingRef.current || uploadMutation.isPending)) {
        return
      }

      if (open) {
        dispatchUploadProgress({
          type: 'reset',
        })
      }

      setUploadDialogOpenState(open)
    },
    [uploadMutation.isPending],
  )

  const uploadSelected = useCallback(() => {
    if (!enabled || isUploadStartingRef.current || uploadMutation.isPending) {
      return
    }

    if (uploadCandidates.length === 0) {
      toast.error(
        'No selected processed images to upload',
      )
      return
    }

    if (selectedAlbumId.length === 0) {
      toast.error('Choose an album before uploading')
      return
    }

    /*
     * Take a snapshot so later queue or selection changes do not alter the
     * currently running upload batch.
     */
    isUploadStartingRef.current = true
    uploadMutation.mutate({
      albumId: selectedAlbumId,
      candidates: [...uploadCandidates],
    })
  }, [
    enabled,
    selectedAlbumId,
    uploadCandidates,
    uploadMutation,
  ])

  const reloadAccountData = useCallback(() => {
    if (enabled) {
      void albumsQuery.refetch()
    }
  }, [albumsQuery, enabled])

  return {
    albums,
    defaultAlbumId,

    accountDataError: albumsQuery.error,
    isLoadingAccountData: albumsQuery.isLoading,
    isRefreshingAccountData: albumsQuery.isFetching,
    reloadAccountData,

    uploadDialogOpen,
    setUploadDialogOpen,

    selectedAlbumId,
    setSelectedAlbumId: setSelectedAlbumOverride,

    uploadCandidates,
    uploadState: uploadProgress.state,
    uploadSummary: uploadProgress.summary,

    isUploading: uploadMutation.isPending,
    uploadSelected,
  }
}
