import type { AlbumImageRecord, ImageRecord } from '@/lib/storage/types'
import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'
import { uploadImageFn } from '@/functions/images'
import { isHostedSourceUploadCompatible } from '@/lib/images/hostedSourceCompatibility'
import { transformImageFile } from '@/lib/img'
import { shouldKeepOriginalImage } from '@/lib/img/output'
import { withoutExtension } from '@/lib/storage/format'

// Image transforms are intentionally serialized to bound decoded bitmap memory.
const UPLOAD_CONCURRENCY = 1

interface UseUploadOptions {
  selectedAlbumId: string
  onUploaded: (uploaded: UploadedImage[]) => void
}

export interface UploadedImage {
  image: ImageRecord
  albumImage: AlbumImageRecord
  publicUrl: string | null
}

interface FailedUpload {
  file: File
  message: string
  albumId: string
}

export interface UploadProgress {
  total: number
  completed: number
  succeeded: number
  failed: number
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * Handles dashboard upload flow and refresh behavior.
 *
 * @param options Upload dependencies.
 * @param options.selectedAlbumId Album id receiving uploaded files.
 * @param options.onUploaded Callback used to refresh dashboard data post-upload.
 * @returns Pending state and file upload action for dashboard top bar.
 */
export function useUpload(options: UseUploadOptions) {
  const { selectedAlbumId, onUploaded } = options
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [failedUploads, setFailedUploads] = useState<FailedUpload[]>([])
  const uploadLockRef = useRef(false)

  const uploadFiles = useCallback(async (
    files: FileList | readonly File[] | null,
    targetAlbumId = selectedAlbumId,
  ) => {
    const batch = files === null ? [] : Array.from(files)
    if (batch.length === 0) {
      return
    }

    if (uploadLockRef.current) {
      return
    }

    if (!targetAlbumId) {
      toast.error('Select an album first')
      return
    }

    uploadLockRef.current = true
    setIsUploading(true)
    setFailedUploads([])
    setUploadProgress({
      total: batch.length,
      completed: 0,
      succeeded: 0,
      failed: 0,
    })

    const uploaded: UploadedImage[] = []
    const failures: FailedUpload[] = []
    let nextIndex = 0
    let completed = 0

    const uploadNext = async (): Promise<void> => {
      while (nextIndex < batch.length) {
        const file = batch[nextIndex]
        nextIndex += 1

        try {
          const transformed = await transformImageFile(file, 'webp')
          const sourceIsHostCompatible = isHostedSourceUploadCompatible(file)
          const keepSource = !transformed.resizedToPixelBudget
            && sourceIsHostCompatible
            && (
              transformed.preservedOriginal
              || shouldKeepOriginalImage({ originalSize: file.size, outputSize: transformed.blob.size })
            )
          const hostedFile = keepSource
            ? file
            : new File(
                [transformed.blob],
                `${withoutExtension(file.name) || 'image'}.webp`,
                { type: transformed.mimeType },
              )
          const thumbnailFile = new File(
            [transformed.thumbnailBlob],
            `${withoutExtension(file.name) || 'image'}.thumbnail.webp`,
            { type: 'image/webp' },
          )
          const formData = new FormData()
          formData.set('file', hostedFile)
          formData.set('thumbnail', thumbnailFile)
          formData.set('albumId', targetAlbumId)
          formData.set('source', 'dashboard-upload')
          formData.set('originalName', file.name)
          uploaded.push(await uploadImageFn({ data: formData }))
        }
        catch (error) {
          failures.push({ file, message: errorMessage(error), albumId: targetAlbumId })
        }
        finally {
          completed += 1
          setUploadProgress({
            total: batch.length,
            completed,
            succeeded: uploaded.length,
            failed: failures.length,
          })
        }
      }
    }

    try {
      await Promise.all(Array.from({ length: Math.min(UPLOAD_CONCURRENCY, batch.length) }, uploadNext))
      if (uploaded.length > 0) {
        onUploaded(uploaded)
      }

      if (failures.length === 0) {
        setUploadProgress(null)
        toast.success(`${uploaded.length} image(s) uploaded`)
        return
      }

      setFailedUploads(failures)
      toast.warning(`${uploaded.length} of ${batch.length} image(s) uploaded`, {
        description: `${failures.length} failed. ${failures[0].message} Retry only the failed files.`,
      })
    }
    finally {
      setIsUploading(false)
      uploadLockRef.current = false
    }
  }, [onUploaded, selectedAlbumId])

  const retryFailedUploads = useCallback(async () => {
    const targetAlbumId = failedUploads[0]?.albumId
    if (targetAlbumId === undefined) {
      return
    }
    await uploadFiles(failedUploads.map(({ file }) => file), targetAlbumId)
  }, [failedUploads, uploadFiles])

  return {
    isUploading,
    uploadProgress,
    failedUploadCount: failedUploads.length,
    uploadFiles,
    retryFailedUploads,
  }
}
