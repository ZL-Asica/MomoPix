import type { ImageCopyFormat } from '@/features/dashboard/lib/copyFormats'
import type { HomeProcessedItem } from '@/features/home/types'
import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { buildImageCopyLines, getImageCopyFormatMeta } from '@/features/dashboard/lib/copyFormats'
import { copyLinesToClipboard } from '@/lib/clipboard'

/**
 * Provides copy actions for uploaded home-page rows using dashboard copy format helpers.
 *
 * @param items Home rows that may include uploaded URLs.
 * @returns Copy status and handlers for selected/all uploaded rows.
 */
export function useCopyLinks(items: readonly HomeProcessedItem[]) {
  const [isCopyLifecyclePending, setIsCopyLifecyclePending] = useState(false)
  const [isCopyTransitionPending, startCopyTransition] = useTransition()
  const isCopyPending = isCopyLifecyclePending || isCopyTransitionPending

  const uploadedItems = useMemo(() => {
    return items.filter(item => item.uploadStatus === 'uploaded' && item.uploadedUrl !== null)
  }, [items])

  const selectedUploadedItems = useMemo(() => {
    return uploadedItems.filter(item => item.selected)
  }, [uploadedItems])

  const toCopyRows = (source: readonly HomeProcessedItem[]) => {
    return source.map(item => ({
      name: item.originalName,
      publicUrl: item.uploadedUrl,
    }))
  }

  const copyRows = async (source: readonly HomeProcessedItem[], format: ImageCopyFormat) => {
    const lines = buildImageCopyLines(toCopyRows(source), format)
    if (lines.length === 0) {
      toast.error('No copyable uploaded links')
      return
    }

    setIsCopyLifecyclePending(true)
    try {
      await copyLinesToClipboard(lines)
      const label = getImageCopyFormatMeta(format).multilineToastLabel
      toast.success(`Copied ${lines.length} ${label} line(s)`)
    }
    catch (error) {
      toast.error('Failed to copy uploaded links', {
        description: error instanceof Error ? error.message : String(error),
      })
    }
    finally {
      setIsCopyLifecyclePending(false)
    }
  }

  const copySelectedUploaded = async (format: ImageCopyFormat) => {
    startCopyTransition(() => {
      void copyRows(selectedUploadedItems, format)
    })
  }

  const copyAllUploaded = async (format: ImageCopyFormat) => {
    startCopyTransition(() => {
      void copyRows(uploadedItems, format)
    })
  }

  return {
    isCopyPending,
    uploadedCount: uploadedItems.length,
    selectedUploadedCount: selectedUploadedItems.length,
    copySelectedUploaded,
    copyAllUploaded,
  }
}
