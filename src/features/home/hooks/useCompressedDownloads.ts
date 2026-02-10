import type { HomeProcessedItem } from '@/features/home/types'
import JSZip from 'jszip'
import { useCallback, useTransition } from 'react'
import { toast } from 'sonner'

function fileBaseName(name: string): string {
  const value = name.split('.').slice(0, -1).join('.').trim()
  return value.length > 0 ? value : name
}

/**
 * Provides single-file and zip download actions for compressed home rows.
 *
 * @param items Current processed home rows.
 * @returns Pending state and callbacks for download actions.
 */
export function useCompressedDownloads(items: readonly HomeProcessedItem[]) {
  const [downloadingAll, startDownloadingAll] = useTransition()

  const downloadOne = useCallback((item: HomeProcessedItem) => {
    if (item.compressedBlob === null) {
      return
    }

    const url = URL.createObjectURL(item.compressedBlob)
    const fileName = `${fileBaseName(item.originalName)}.${item.targetFormat}`
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success(`Downloaded ${fileName}`)
  }, [])

  const downloadAll = useCallback(() => {
    startDownloadingAll(async () => {
      const transformed = items.filter(item => item.compressedBlob !== null)
      if (transformed.length === 0) {
        toast.error('No compressed images available to download')
        return
      }

      const zip = new JSZip()
      for (const item of transformed) {
        if (!item.compressedBlob) {
          continue
        }
        const fileName = `${fileBaseName(item.originalName)}.${item.targetFormat}`
        zip.file(fileName, item.compressedBlob)
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `images-${new Date().toISOString().slice(0, 10)}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('Downloaded compressed image zip')
    })
  }, [items, startDownloadingAll])

  return {
    downloadingAll,
    downloadOne,
    downloadAll,
  }
}
