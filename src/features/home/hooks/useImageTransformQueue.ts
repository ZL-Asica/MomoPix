import type { CompressionState, HomeProcessedItem } from '@/features/home/types'
import { nanoid } from 'nanoid'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  MAX_QUEUE_ITEMS,
  MAX_QUEUE_SOURCE_BYTES,
  selectWithinQueueBudget,
} from '@/features/home/lib/memoryBudget'
import { isHostedSourceUploadCompatible } from '@/lib/images/hostedSourceCompatibility'
import { checkImage, normalizeTransformError, transformImageFile } from '@/lib/img'
import { shouldKeepOriginalImage } from '@/lib/img/output'
import { normalizeImageMime } from '@/lib/storage/format'
import { getHumanReadableFileSize } from '@/utils/converter'

function fileBaseName(name: string): string {
  const value = name.split('.').slice(0, -1).join('.').trim()
  return value.length > 0 ? value : name
}

function toCompressedFile(input: {
  blob: Blob
  originalName: string
  targetFormat: SupportedFormat
}): File {
  const fileName = `${fileBaseName(input.originalName)}.${input.targetFormat}`
  const mime = normalizeImageMime(input.targetFormat, input.blob.type)
  return new File([input.blob], fileName, { type: mime })
}

function toThumbnailFile(input: { blob: Blob, originalName: string }): File {
  return new File(
    [input.blob],
    `${fileBaseName(input.originalName)}.thumbnail.webp`,
    { type: 'image/webp' },
  )
}

/**
 * Owns home page image queue, per-item compression states, and transform settings.
 *
 * Side effects:
 * - Creates and revokes object URLs for local previews.
 * - Shows transform lifecycle toasts.
 *
 * @returns Queue rows, transform controls, and mutation handlers.
 */
export function useImageTransformQueue() {
  const [items, setItems] = useState<HomeProcessedItem[]>([])
  const [targetFormat, setTargetFormat] = useState<SupportedFormat>('webp')
  const [quality, setQuality] = useState<number>(80)
  const [useManualQuality, setUseManualQuality] = useState(false)
  const [retainOriginal, setRetainOriginal] = useState(false)
  const [compressionState, setCompressionState] = useState<CompressionState>('idle')
  const [compressedCount, setCompressedCount] = useState(0)
  const [isTransforming, setIsTransforming] = useState(false)
  const itemsRef = useRef<HomeProcessedItem[]>([])
  const isTransformingRef = useRef(false)
  const queueSourceBytesRef = useRef(0)
  const objectUrlsRef = useRef(new Set<string>())
  const isMountedRef = useRef(true)

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    const objectUrls = objectUrlsRef.current
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      for (const url of objectUrls) {
        URL.revokeObjectURL(url)
      }
      objectUrls.clear()
    }
  }, [])

  const createTrackedObjectUrl = useCallback((blob: Blob): string => {
    const url = URL.createObjectURL(blob)
    objectUrlsRef.current.add(url)
    return url
  }, [])

  const revokeTrackedObjectUrl = useCallback((url: string | null): void => {
    if (url === null || !objectUrlsRef.current.delete(url)) {
      return
    }
    URL.revokeObjectURL(url)
  }, [])

  const patchItem = useCallback((id: string, patch: Partial<HomeProcessedItem>) => {
    setItems(prev => prev.map(item => (item.id === id ? { ...item, ...patch } : item)))
  }, [])

  const addImages = useCallback((files: File[]) => {
    const validFiles: Array<{ file: File, format: string, name: string, originalSize: number, size: number }> = []

    for (const file of files) {
      try {
        const { format, name, originalSize } = checkImage(file)
        validFiles.push({ file, format, name, originalSize, size: file.size })
      }
      catch (error) {
        toast.error('Skipped invalid image', {
          description: error instanceof Error ? `${file.name}: ${error.message}` : String(error),
        })
      }
    }

    const budget = selectWithinQueueBudget({
      currentBytes: queueSourceBytesRef.current,
      currentItems: itemsRef.current.length,
      candidates: validFiles,
    })
    const accepted: HomeProcessedItem[] = budget.accepted.map(({ file, format, name, originalSize }) => ({
      id: nanoid(8),
      originalFile: file,
      originalName: name,
      originalSize,
      originalPreviewUrl: createTrackedObjectUrl(file),
      thumbnailPreviewUrl: null,
      originalFormat: format,
      targetFormat,
      outputBlob: null,
      outputFile: null,
      outputSize: null,
      uploadFile: null,
      width: null,
      height: null,
      sourceWidth: null,
      sourceHeight: null,
      thumbnailBlob: null,
      thumbnailFile: null,
      thumbnailSize: null,
      thumbnailWidth: null,
      thumbnailHeight: null,
      retainOriginal,
      status: 'idle',
      transformError: null,
      transformNotice: null,
      uploadStatus: 'idle',
      uploadError: null,
      uploadedUrl: null,
      uploadedObjectKey: null,
      uploadedAlbumId: null,
      selected: false,
    }))

    if (budget.rejected.length > 0) {
      toast.warning(`${budget.rejected.length} image(s) were not added`, {
        description: `One queue can hold up to ${MAX_QUEUE_ITEMS} images or ${getHumanReadableFileSize(MAX_QUEUE_SOURCE_BYTES)} of source files.`,
      })
    }

    if (accepted.length > 0) {
      queueSourceBytesRef.current = budget.totalBytes
      const nextItems = [...itemsRef.current, ...accepted]
      itemsRef.current = nextItems
      setItems(nextItems)
      setCompressionState('idle')
    }
  }, [createTrackedObjectUrl, retainOriginal, targetFormat])

  const removeItem = useCallback((id: string) => {
    const target = itemsRef.current.find(item => item.id === id)
    if (target) {
      queueSourceBytesRef.current = Math.max(0, queueSourceBytesRef.current - target.originalSize)
      revokeTrackedObjectUrl(target.originalPreviewUrl)
      revokeTrackedObjectUrl(target.thumbnailPreviewUrl)
    }
    const nextItems = itemsRef.current.filter(item => item.id !== id)
    itemsRef.current = nextItems
    setItems(nextItems)
  }, [revokeTrackedObjectUrl])

  const transformOne = useCallback(async (item: HomeProcessedItem): Promise<HomeProcessedItem> => {
    const transformed = await transformImageFile(
      item.originalFile,
      targetFormat,
      useManualQuality ? quality : undefined,
    )
    const {
      blob,
      width,
      height,
      sourceWidth,
      sourceHeight,
      thumbnailBlob,
      thumbnailWidth,
      thumbnailHeight,
    } = transformed
    const thumbnailFile = toThumbnailFile({
      blob: thumbnailBlob,
      originalName: item.originalName,
    })
    const thumbnailPreviewUrl = isMountedRef.current
      ? createTrackedObjectUrl(thumbnailBlob)
      : null
    revokeTrackedObjectUrl(item.thumbnailPreviewUrl)
    const derivativePatch = {
      sourceWidth,
      sourceHeight,
      thumbnailBlob,
      thumbnailFile,
      thumbnailSize: thumbnailBlob.size,
      thumbnailWidth,
      thumbnailHeight,
      thumbnailPreviewUrl,
      retainOriginal,
      transformNotice: transformed.sourceNotice,
    }
    if (transformed.preservedOriginal) {
      const compressedFile = toCompressedFile({
        blob,
        originalName: item.originalName,
        targetFormat,
      })
      const canHostOriginal = !transformed.resizedToPixelBudget
        && isHostedSourceUploadCompatible(item.originalFile)
      const notices = [
        transformed.sourceNotice,
        canHostOriginal
          ? 'Animation was kept unchanged.'
          : 'Animation was kept for download; a static converted frame will be used for hosting compatibility.',
      ].filter((notice): notice is string => notice !== null)
      return {
        ...item,
        ...derivativePatch,
        targetFormat,
        outputBlob: item.originalFile,
        outputFile: item.originalFile,
        outputSize: item.originalSize,
        uploadFile: canHostOriginal ? item.originalFile : compressedFile,
        width: canHostOriginal ? sourceWidth : width,
        height: canHostOriginal ? sourceHeight : height,
        status: 'original',
        transformError: null,
        transformNotice: notices.join(' '),
        uploadStatus: 'idle',
        uploadError: null,
        uploadedUrl: null,
        uploadedObjectKey: null,
        uploadedAlbumId: null,
      }
    }
    if (shouldKeepOriginalImage({
      originalSize: item.originalSize,
      outputSize: blob.size,
    })) {
      const compressedFile = toCompressedFile({
        blob,
        originalName: item.originalName,
        targetFormat,
      })
      const canHostOriginal = !transformed.resizedToPixelBudget
        && isHostedSourceUploadCompatible(item.originalFile)
      const uploadFile = canHostOriginal
        ? item.originalFile
        : compressedFile
      return {
        ...item,
        ...derivativePatch,
        targetFormat,
        outputBlob: item.originalFile,
        outputFile: item.originalFile,
        outputSize: item.originalSize,
        uploadFile,
        width: canHostOriginal ? sourceWidth : width,
        height: canHostOriginal ? sourceHeight : height,
        status: 'original',
        transformError: null,
        transformNotice: canHostOriginal
          ? 'Original kept because conversion did not reduce the file size.'
          : 'Original kept for download; the resized or converted file will be used for hosting compatibility.',
        uploadStatus: 'idle',
        uploadError: null,
        uploadedUrl: null,
        uploadedObjectKey: null,
        uploadedAlbumId: null,
      }
    }
    const compressedFile = toCompressedFile({
      blob,
      originalName: item.originalName,
      targetFormat,
    })

    return {
      ...item,
      ...derivativePatch,
      targetFormat,
      outputBlob: blob,
      outputFile: compressedFile,
      outputSize: blob.size,
      uploadFile: compressedFile,
      width,
      height,
      status: 'compressed',
      transformError: null,
      uploadStatus: 'idle',
      uploadError: null,
      uploadedUrl: null,
      uploadedObjectKey: null,
      uploadedAlbumId: null,
    }
  }, [createTrackedObjectUrl, quality, retainOriginal, revokeTrackedObjectUrl, targetFormat, useManualQuality])

  const transformAll = useCallback(async () => {
    if (isTransformingRef.current || itemsRef.current.length === 0) {
      if (itemsRef.current.length === 0) {
        toast.error('Please add some images first')
      }
      return
    }

    /*
     * State updates do not disable the button until React's next render. Keep
     * this synchronous guard so rapid clicks cannot start overlapping transforms.
     */
    isTransformingRef.current = true
    setIsTransforming(true)

    try {
      setCompressionState('compressing')
      setCompressedCount(0)

      // Let React commit the pending state before cloning a large File into the worker.
      await new Promise<void>(resolve => setTimeout(resolve, 0))

      let succeeded = 0
      let failed = 0
      let retainedOriginals = 0

      for (let index = 0; index < itemsRef.current.length; index += 1) {
        const current = itemsRef.current[index]

        patchItem(current.id, {
          status: 'compressing',
          transformError: null,
        })

        try {
          const transformed = await transformOne(current)
          patchItem(current.id, transformed)
          if (transformed.status === 'original') {
            retainedOriginals += 1
          }
          succeeded += 1
        }
        catch (error) {
          const normalized = normalizeTransformError(error)
          if (current.thumbnailPreviewUrl !== null) {
            revokeTrackedObjectUrl(current.thumbnailPreviewUrl)
          }
          patchItem(current.id, {
            status: 'error',
            transformError: normalized.message,
            outputBlob: null,
            outputFile: null,
            outputSize: null,
            uploadFile: null,
            width: null,
            height: null,
            sourceWidth: null,
            sourceHeight: null,
            thumbnailBlob: null,
            thumbnailFile: null,
            thumbnailSize: null,
            thumbnailWidth: null,
            thumbnailHeight: null,
            thumbnailPreviewUrl: null,
            uploadStatus: 'idle',
            uploadError: null,
            uploadedUrl: null,
            uploadedObjectKey: null,
            uploadedAlbumId: null,
            transformNotice: null,
          })
          failed += 1
        }
        finally {
          setCompressedCount(index + 1)
        }
      }

      if (succeeded > 0 && failed === 0) {
        if (retainedOriginals > 0) {
          toast.warning('Some original files were kept', {
            description: `${retainedOriginals} image(s) kept their original file because conversion was not beneficial or would lose animation.`,
          })
        }
        else {
          toast.success('Images compressed successfully')
        }
        setCompressionState('success')
        return
      }

      if (succeeded > 0 && failed > 0) {
        toast.warning('Compression partially completed', {
          description: `${succeeded} succeeded, ${failed} failed.`,
        })
        setCompressionState('error')
        return
      }

      toast.error('Failed to compress images')
      setCompressionState('error')
    }
    finally {
      isTransformingRef.current = false
      setIsTransforming(false)
    }
  }, [patchItem, revokeTrackedObjectUrl, transformOne])

  const retryTransform = useCallback(async (id: string) => {
    if (isTransformingRef.current) {
      return
    }

    const target = itemsRef.current.find(item => item.id === id)
    if (!target) {
      return
    }

    isTransformingRef.current = true
    setIsTransforming(true)
    setCompressionState('idle')
    patchItem(id, {
      status: 'compressing',
      transformError: null,
    })

    try {
      await new Promise<void>(resolve => setTimeout(resolve, 0))
      const transformed = await transformOne(target)
      patchItem(id, transformed)
      toast.success(`Recompressed ${target.originalName}`)
      setCompressionState('success')
    }
    catch (error) {
      const normalized = normalizeTransformError(error)
      if (target.thumbnailPreviewUrl !== null) {
        revokeTrackedObjectUrl(target.thumbnailPreviewUrl)
      }
      patchItem(id, {
        status: 'error',
        transformError: normalized.message,
        outputBlob: null,
        outputFile: null,
        outputSize: null,
        uploadFile: null,
        width: null,
        height: null,
        sourceWidth: null,
        sourceHeight: null,
        thumbnailBlob: null,
        thumbnailFile: null,
        thumbnailSize: null,
        thumbnailWidth: null,
        thumbnailHeight: null,
        thumbnailPreviewUrl: null,
        uploadStatus: 'idle',
        uploadError: null,
        uploadedUrl: null,
        uploadedObjectKey: null,
        uploadedAlbumId: null,
        transformNotice: null,
      })
      toast.error(`Failed to recompress ${target.originalName}`, {
        description: normalized.message,
      })
      setCompressionState('error')
    }
    finally {
      isTransformingRef.current = false
      setIsTransforming(false)
    }
  }, [patchItem, revokeTrackedObjectUrl, transformOne])

  return {
    items,
    targetFormat,
    setTargetFormat,
    quality,
    setQuality,
    useManualQuality,
    setUseManualQuality,
    retainOriginal,
    setRetainOriginal,
    compressionState,
    compressedCount,
    isTransforming,
    addImages,
    removeItem,
    transformAll,
    retryTransform,
    patchItem,
  }
}
