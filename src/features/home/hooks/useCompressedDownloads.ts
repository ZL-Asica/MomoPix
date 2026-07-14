import type { HomeProcessedItem } from '@/features/home/types'
import JSZip from 'jszip'
import { useCallback, useTransition } from 'react'
import { toast } from 'sonner'

/**
 * Provides single-file and zip download actions for processed home rows.
 *
 * @param items Current processed home rows.
 * @returns Pending state and callbacks for download actions.
 */
export function useCompressedDownloads(items: readonly HomeProcessedItem[]) {
  const [downloadingAll, startDownloadingAll] = useTransition()

  const downloadOne = useCallback((item: HomeProcessedItem) => {
    if (item.outputFile === null) {
      return
    }

    const url = URL.createObjectURL(item.outputFile)
    const fileName = item.outputFile.name
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
      const transformed = items.filter(item => item.outputFile !== null)
      if (transformed.length === 0) {
        toast.error('No processed images available to download')
        return
      }

      const zip = new JSZip()
      for (const item of transformed) {
        if (!item.outputFile) {
          continue
        }
        zip.file(item.outputFile.name, item.outputFile)
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
      toast.success('Downloaded processed image zip')
    })
  }, [items, startDownloadingAll])

  return {
    downloadingAll,
    downloadOne,
    downloadAll,
  }
}
