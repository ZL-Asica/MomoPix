import type { HomeProcessedItem, UploadState, UploadSummary } from '@/features/home/types'
import type { AlbumRecord } from '@/lib/storage/types'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { listAlbumsFn } from '@/functions/albums'
import { uploadImageFn } from '@/functions/images'
import { runBulkOperation } from '@/lib/bulk'

const UPLOAD_CONCURRENCY = 3
const UPLOAD_TIMEOUT_MS = 45_000

interface UploadImageResponse {
  image: {
    objectKey: string
    albumId: string
  }
  publicUrl: string | null
}

interface UseUploadSelectedInput {
  enabled: boolean
  items: readonly HomeProcessedItem[]
  selectedIds: Set<string>
  patchItem: (id: string, patch: Partial<HomeProcessedItem>) => void
  clearSelection: () => void
}

/**
 * Handles post-compression upload flow, album defaults, and upload progress state.
 *
 * @param input Upload dependencies.
 * @param input.enabled Enables account-bound upload behaviors.
 * @param input.items Current home queue rows.
 * @param input.selectedIds Selected row ids eligible for upload.
 * @param input.patchItem Per-row patch helper from transform queue.
 * @param input.clearSelection Clears UI selection after successful uploads.
 * @returns Upload dialog state, album choices, progress summary, and submit action.
 */
export function useUploadSelected(input: UseUploadSelectedInput) {
  const {
    enabled,
    items,
    selectedIds,
    patchItem,
    clearSelection,
  } = input
  const [albums, setAlbums] = useState<AlbumRecord[]>([])
  const [defaultAlbumId, setDefaultAlbumId] = useState<string | null>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedAlbumId, setSelectedAlbumId] = useState('')
  const [isLoadingAccountData, setIsLoadingAccountData] = useState(false)
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [uploadSummary, setUploadSummary] = useState<UploadSummary>({
    total: 0,
    succeeded: 0,
    failed: 0,
  })

  useEffect(() => {
    if (!enabled) {
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setAlbums([])
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setDefaultAlbumId(null)
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setSelectedAlbumId('')
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setUploadDialogOpen(false)
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setUploadState('idle')
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
      setUploadSummary({ total: 0, succeeded: 0, failed: 0 })
      return
    }

    let cancelled = false
    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
    setIsLoadingAccountData(true)

    void (async () => {
      try {
        const payload = await listAlbumsFn()
        if (cancelled) {
          return
        }

        setAlbums(payload.albums)
        setDefaultAlbumId(payload.meta.defaultAlbumId)
        setSelectedAlbumId((previous) => {
          if (previous.length > 0 && payload.albums.some(album => album.id === previous)) {
            return previous
          }
          return payload.meta.defaultAlbumId
        })
      }
      catch (error) {
        if (!cancelled) {
          toast.error('Failed to load upload albums', {
            description: error instanceof Error ? error.message : String(error),
          })
        }
      }
      finally {
        if (!cancelled) {
          setIsLoadingAccountData(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [enabled])

  const uploadCandidates = useMemo(() => {
    return items.filter(item => (
      selectedIds.has(item.id)
      && item.status === 'compressed'
      && item.compressedFile !== null
      && item.uploadStatus !== 'uploaded'
    ))
  }, [items, selectedIds])

  const uploadSelected = useCallback(async () => {
    if (!enabled) {
      return
    }

    if (uploadCandidates.length === 0) {
      toast.error('No selected compressed images to upload')
      return
    }

    if (selectedAlbumId.trim().length === 0) {
      toast.error('Choose an album before uploading')
      return
    }

    setUploadState('uploading')
    setUploadSummary({ total: uploadCandidates.length, succeeded: 0, failed: 0 })

    for (const item of uploadCandidates) {
      patchItem(item.id, {
        uploadStatus: 'uploading',
        uploadError: null,
      })
    }

    try {
      const result = await runBulkOperation(uploadCandidates, async (item) => {
        try {
          const file = item.compressedFile
          if (!file) {
            throw new Error('Missing compressed output file')
          }

          const formData = new FormData()
          formData.set('file', file)
          formData.set('albumId', selectedAlbumId)
          formData.set('source', 'index-compressed')
          formData.set('originalName', item.originalName)
          if (item.width !== null && item.height !== null) {
            formData.set('width', String(item.width))
            formData.set('height', String(item.height))
          }

          const payload = await uploadImageFn({ data: formData }) as UploadImageResponse
          patchItem(item.id, {
            uploadStatus: 'uploaded',
            uploadError: null,
            uploadedObjectKey: payload.image.objectKey,
            uploadedAlbumId: payload.image.albumId,
            uploadedUrl: payload.publicUrl,
          })
          setUploadSummary(previous => ({
            ...previous,
            succeeded: previous.succeeded + 1,
          }))
          return payload
        }
        catch (error) {
          patchItem(item.id, {
            uploadStatus: 'error',
            uploadError: error instanceof Error ? error.message : String(error),
          })
          setUploadSummary(previous => ({
            ...previous,
            failed: previous.failed + 1,
          }))
          throw error
        }
      }, {
        concurrency: UPLOAD_CONCURRENCY,
        timeoutMs: UPLOAD_TIMEOUT_MS,
      })

      const succeeded = result.ok.length
      const failed = result.failed.length
      setUploadSummary({ total: uploadCandidates.length, succeeded, failed })

      if (failed === 0) {
        setUploadState('success')
        setUploadDialogOpen(false)
        clearSelection()
        toast.success(`Uploaded ${succeeded} image(s)`)
        return
      }

      setUploadState('error')
      toast.error(`Uploaded ${succeeded} image(s), ${failed} failed`)
    }
    catch (error) {
      setUploadState('error')
      toast.error('Upload failed', {
        description: error instanceof Error ? error.message : String(error),
      })
    }
  }, [clearSelection, enabled, patchItem, selectedAlbumId, uploadCandidates])

  return {
    albums,
    defaultAlbumId,
    uploadDialogOpen,
    setUploadDialogOpen,
    selectedAlbumId,
    setSelectedAlbumId,
    isLoadingAccountData,
    uploadState,
    uploadSummary,
    uploadSelected,
  }
}
