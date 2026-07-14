import type { AlbumImageRecord, ImageRecord } from '@/lib/storage/types'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { uploadImageFn } from '@/functions/images'
import { getImageDimensions } from '@/lib/images/dimensions'

interface UseUploadOptions {
  selectedAlbumId: string
  onUploaded: (uploaded: UploadedImage[]) => void
}

export interface UploadedImage {
  image: ImageRecord
  albumImage: AlbumImageRecord
  publicUrl: string | null
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

  const uploadFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return
    }

    if (!selectedAlbumId) {
      toast.error('Select an album first')
      return
    }

    setIsUploading(true)
    try {
      const uploaded: UploadedImage[] = []
      for (const file of Array.from(files)) {
        const dimensions = await getImageDimensions(file)
        if (dimensions === null) {
          toast.warning('Could not read image dimensions', {
            description: `Uploading ${file.name} without width/height metadata`,
          })
        }

        const formData = new FormData()
        formData.set('file', file)
        formData.set('albumId', selectedAlbumId)
        formData.set('source', 'dashboard-upload')
        if (dimensions !== null) {
          formData.set('width', String(dimensions.width))
          formData.set('height', String(dimensions.height))
        }
        uploaded.push(await uploadImageFn({ data: formData }))
      }

      onUploaded(uploaded)
      toast.success(`${files.length} image(s) uploaded`)
    }
    catch (error) {
      toast.error('Upload failed', {
        description: error instanceof Error ? error.message : String(error),
      })
    }
    finally {
      setIsUploading(false)
    }
  }, [onUploaded, selectedAlbumId])

  return {
    isUploading,
    uploadFiles,
  }
}
