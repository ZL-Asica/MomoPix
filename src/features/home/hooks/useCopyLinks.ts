import type { ImageCopyFormat } from '@/features/dashboard/lib/copyFormats'
import type { HomeProcessedItem } from '@/features/home/types'
import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { buildImageCopyLines } from '@/features/dashboard/lib/copyFormats'
import { copyLinesToClipboard } from '@/lib/clipboard'

function copyLabel(format: ImageCopyFormat): string {
  switch (format) {
    case 'direct':
      return 'direct links'
    case 'html':
      return 'HTML <img>'
    case 'markdown':
      return 'Markdown'
  }
}

/**
 * Provides copy actions for uploaded home-page rows using dashboard copy format helpers.
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
      toast.success(`Copied ${lines.length} ${copyLabel(format)} line(s)`)
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
