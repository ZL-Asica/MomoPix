import type { CompressionState, HomeProcessedItem } from '@/features/home/types'
import { nanoid } from 'nanoid'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { getImageDimensions } from '@/lib/images/dimensions'
import { checkImage, normalizeTransformError, transformImageFile } from '@/lib/img'
import { shouldKeepOriginalImage } from '@/lib/img/output'
import { normalizeImageMime } from '@/lib/storage/format'

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
  const [compressionState, setCompressionState] = useState<CompressionState>('idle')
  const [compressedCount, setCompressedCount] = useState(0)
  const itemsRef = useRef<HomeProcessedItem[]>([])

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    return () => {
      for (const item of itemsRef.current) {
        URL.revokeObjectURL(item.originalPreviewUrl)
      }
    }
  }, [])

  const patchItem = useCallback((id: string, patch: Partial<HomeProcessedItem>) => {
    setItems(prev => prev.map(item => (item.id === id ? { ...item, ...patch } : item)))
  }, [])

  const addImages = useCallback((files: File[]) => {
    const accepted: HomeProcessedItem[] = []

    for (const file of files) {
      try {
        const { name, originalSize } = checkImage(file)
        const extension = name.split('.').slice(-1)[0]
        accepted.push({
          id: nanoid(8),
          originalFile: file,
          originalName: name,
          originalSize,
          originalPreviewUrl: URL.createObjectURL(file),
          originalFormat: normalizeImageMime(extension, file.type).replace('image/', ''),
          targetFormat,
          outputBlob: null,
          outputFile: null,
          outputSize: null,
          width: null,
          height: null,
          status: 'idle',
          transformError: null,
          uploadStatus: 'idle',
          uploadError: null,
          uploadedUrl: null,
          uploadedObjectKey: null,
          uploadedAlbumId: null,
          selected: false,
        })
      }
      catch (error) {
        toast.error('Skipped invalid image', {
          description: error instanceof Error ? `${file.name}: ${error.message}` : String(error),
        })
      }
    }

    if (accepted.length > 0) {
      setItems(prev => [...prev, ...accepted])
      setCompressionState('idle')
    }
  }, [targetFormat])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const target = prev.find(item => item.id === id)
      if (target) {
        URL.revokeObjectURL(target.originalPreviewUrl)
      }
      return prev.filter(item => item.id !== id)
    })
  }, [])

  const transformOne = useCallback(async (item: HomeProcessedItem): Promise<HomeProcessedItem> => {
    const { blob } = await transformImageFile(
      item.originalFile,
      targetFormat,
      useManualQuality ? quality : undefined,
    )
    const compressedFile = toCompressedFile({
      blob,
      originalName: item.originalName,
      targetFormat,
    })

    if (shouldKeepOriginalImage({
      originalSize: item.originalSize,
      outputSize: blob.size,
    })) {
      const dimensions = await getImageDimensions(item.originalFile)
      return {
        ...item,
        targetFormat,
        outputBlob: item.originalFile,
        outputFile: item.originalFile,
        outputSize: item.originalSize,
        width: dimensions?.width ?? null,
        height: dimensions?.height ?? null,
        status: 'original',
        transformError: 'The original file was kept.',
        uploadStatus: 'idle',
        uploadError: null,
        uploadedUrl: null,
        uploadedObjectKey: null,
        uploadedAlbumId: null,
      }
    }

    const dimensions = await getImageDimensions(compressedFile)

    return {
      ...item,
      targetFormat,
      outputBlob: blob,
      outputFile: compressedFile,
      outputSize: blob.size,
      width: dimensions?.width ?? null,
      height: dimensions?.height ?? null,
      status: 'compressed',
      transformError: null,
      uploadStatus: 'idle',
      uploadError: null,
      uploadedUrl: null,
      uploadedObjectKey: null,
      uploadedAlbumId: null,
    }
  }, [quality, targetFormat, useManualQuality])

  const transformAll = useCallback(async () => {
    if (itemsRef.current.length === 0) {
      toast.error('Please add some images first')
      return
    }

    setCompressionState('compressing')
    setCompressedCount(0)

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
        patchItem(current.id, {
          status: 'error',
          transformError: normalized.message,
          outputBlob: null,
          outputFile: null,
          outputSize: null,
          width: null,
          height: null,
          uploadStatus: 'idle',
          uploadError: null,
          uploadedUrl: null,
          uploadedObjectKey: null,
          uploadedAlbumId: null,
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
          description: `${retainedOriginals} conversion(s) would have increased file size.`,
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
  }, [patchItem, transformOne])

  const retryTransform = useCallback(async (id: string) => {
    const target = itemsRef.current.find(item => item.id === id)
    if (!target) {
      return
    }

    patchItem(id, {
      status: 'compressing',
      transformError: null,
    })

    try {
      const transformed = await transformOne(target)
      patchItem(id, transformed)
      toast.success(`Recompressed ${target.originalName}`)
    }
    catch (error) {
      const normalized = normalizeTransformError(error)
      patchItem(id, {
        status: 'error',
        transformError: normalized.message,
        outputBlob: null,
        outputFile: null,
        outputSize: null,
        width: null,
        height: null,
        uploadStatus: 'idle',
        uploadError: null,
        uploadedUrl: null,
        uploadedObjectKey: null,
        uploadedAlbumId: null,
      })
      toast.error(`Failed to recompress ${target.originalName}`, {
        description: normalized.message,
      })
    }
  }, [patchItem, transformOne])

  return {
    items,
    targetFormat,
    setTargetFormat,
    quality,
    setQuality,
    useManualQuality,
    setUseManualQuality,
    compressionState,
    compressedCount,
    addImages,
    removeItem,
    transformAll,
    retryTransform,
    patchItem,
  }
}
