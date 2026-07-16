import type { CompressionState, HomeProcessedItem } from '@/features/home/types'
import { nanoid } from 'nanoid'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { checkImage, normalizeTransformError, transformImageFile } from '@/lib/img'
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

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    return () => {
      for (const item of itemsRef.current) {
        URL.revokeObjectURL(item.originalPreviewUrl)
        if (item.thumbnailPreviewUrl !== null) {
          URL.revokeObjectURL(item.thumbnailPreviewUrl)
        }
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
        const { format, name, originalSize } = checkImage(file)
        accepted.push({
          id: nanoid(8),
          originalFile: file,
          originalName: name,
          originalSize,
          originalPreviewUrl: URL.createObjectURL(file),
          thumbnailPreviewUrl: null,
          originalFormat: format,
          targetFormat,
          outputBlob: null,
          outputFile: null,
          outputSize: null,
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
  }, [retainOriginal, targetFormat])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const target = prev.find(item => item.id === id)
      if (target) {
        URL.revokeObjectURL(target.originalPreviewUrl)
        if (target.thumbnailPreviewUrl !== null) {
          URL.revokeObjectURL(target.thumbnailPreviewUrl)
        }
      }
      return prev.filter(item => item.id !== id)
    })
  }, [])

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
    const thumbnailPreviewUrl = URL.createObjectURL(thumbnailBlob)
    if (item.thumbnailPreviewUrl !== null) {
      URL.revokeObjectURL(item.thumbnailPreviewUrl)
    }
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
      return {
        ...item,
        ...derivativePatch,
        targetFormat,
        outputBlob: item.originalFile,
        outputFile: item.originalFile,
        outputSize: item.originalSize,
        width,
        height,
        status: 'original',
        transformError: 'Animated images are uploaded unchanged.',
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
  }, [quality, retainOriginal, targetFormat, useManualQuality])

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
            URL.revokeObjectURL(current.thumbnailPreviewUrl)
          }
          patchItem(current.id, {
            status: 'error',
            transformError: normalized.message,
            outputBlob: null,
            outputFile: null,
            outputSize: null,
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
            description: `${retainedOriginals} animated image(s) were preserved to avoid flattening frames.`,
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
  }, [patchItem, transformOne])

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
      const transformed = await transformOne(target)
      patchItem(id, transformed)
      toast.success(`Recompressed ${target.originalName}`)
      setCompressionState('success')
    }
    catch (error) {
      const normalized = normalizeTransformError(error)
      if (target.thumbnailPreviewUrl !== null) {
        URL.revokeObjectURL(target.thumbnailPreviewUrl)
      }
      patchItem(id, {
        status: 'error',
        transformError: normalized.message,
        outputBlob: null,
        outputFile: null,
        outputSize: null,
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
  }, [patchItem, transformOne])

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
