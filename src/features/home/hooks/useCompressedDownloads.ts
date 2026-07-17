import type { HomeProcessedItem } from '@/features/home/types'
import JSZip from 'jszip'
import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'
import { getZipInputBytes, MAX_ZIP_INPUT_BYTES } from '@/features/home/lib/memoryBudget'
import { uniqueDownloadNames } from '@/features/home/lib/uniqueDownloadNames'
import { getHumanReadableFileSize } from '@/utils/converter'

/**
 * Provides single-file and zip download actions for processed home rows.
 *
 * @param items Current processed home rows.
 * @returns Pending state and callbacks for download actions.
 */
export function useCompressedDownloads(items: readonly HomeProcessedItem[]) {
  const [downloadingAll, setDownloadingAll] = useState(false)
  const downloadingAllRef = useRef(false)

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
    if (downloadingAllRef.current) {
      return
    }
    downloadingAllRef.current = true
    setDownloadingAll(true)

    void (async () => {
      try {
        const transformed = items.filter(item => item.outputFile !== null)
        if (transformed.length === 0) {
          toast.error('No processed images available to download')
          return
        }

        const outputFiles = transformed.flatMap(item => item.outputFile === null ? [] : [item.outputFile])
        const zipInputBytes = getZipInputBytes(outputFiles)
        if (zipInputBytes > MAX_ZIP_INPUT_BYTES) {
          toast.error('Batch is too large to zip safely in this browser tab', {
            description: `${getHumanReadableFileSize(zipInputBytes)} exceeds the ${getHumanReadableFileSize(MAX_ZIP_INPUT_BYTES)} ZIP memory guard. Download files individually instead.`,
          })
          return
        }

        const zip = new JSZip()
        const entryNames = uniqueDownloadNames(outputFiles.map(file => file.name))
        for (const [index, file] of outputFiles.entries()) {
          zip.file(entryNames[index] ?? file.name, file)
        }

        const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'STORE', streamFiles: true })
        const url = URL.createObjectURL(zipBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `images-${new Date().toISOString().slice(0, 10)}.zip`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success('Downloaded processed image zip')
      }
      catch (error) {
        toast.error('Could not prepare the image zip', {
          description: error instanceof Error ? error.message : String(error),
        })
      }
      finally {
        downloadingAllRef.current = false
        setDownloadingAll(false)
      }
    })()
  }, [items])

  return {
    downloadingAll,
    downloadOne,
    downloadAll,
  }
}
