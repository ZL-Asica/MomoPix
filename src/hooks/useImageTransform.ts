import { nanoid } from 'nanoid'
import { useState } from 'react'
import { toast } from 'sonner'
import { checkImage, normalizeTransformError, transformImageFile } from '@/lib/img'

const useImageTransform = () => {
  const [images, setImages] = useState<ImageFile[]>([])
  const [transformedImageCount, setTransformedImageCount] = useState(0)
  const [targetFormat, setTargetFormat] = useState<SupportedFormat>('webp')
  const [quality, setQuality] = useState<number>(80)
  const [isProcessing, setIsProcessing] = useState(false)
  const [useManualQuality, setUseManualQuality] = useState(false)

  const addImages = (files: File[]) => {
    const newImages = files.map((file) => {
      const { format, name, originalSize } = checkImage(file)
      return {
        id: nanoid(8),
        file,
        name,
        preview: URL.createObjectURL(file),
        format,
        originalSize,
      }
    })
    setImages(prev => [...prev, ...newImages])
  }

  const transformImages = async (): Promise<ImageFile[] | null> => {
    if (images.length === 0) {
      toast.error('Please add some images first')
      return null
    }

    setTransformedImageCount(0)
    setIsProcessing(true)

    try {
      const updated: ImageFile[] = []

      for (let index = 0; index < images.length; index++) {
        const image = images[index]

        const { blob } = await transformImageFile(
          image.file,
          targetFormat,
          useManualQuality ? quality : undefined,
        )

        updated.push({
          ...image,
          transformed: blob,
          targetFormat,
          compressedSize: blob.size,
        })

        setTransformedImageCount(index + 1)
      }

      setImages(updated)
      toast.success('Images transformed successfully')
      return updated
    }
    catch (error: unknown) {
      const normalized = normalizeTransformError(error)
      toast.error('Failed to transform images', { description: normalized.message })
      return null
    }
    finally {
      setIsProcessing(false)
    }
  }

  const removeImage = (id: string) => {
    setImages((prev) => {
      const newImages = [...prev]
      URL.revokeObjectURL(newImages.find(image => image.id === id)?.preview ?? '')
      newImages.splice(newImages.findIndex(image => image.id === id), 1)
      return newImages
    })
  }

  return {
    images,
    targetFormat,
    setTargetFormat,
    quality,
    setQuality,
    isProcessing,
    transformedImageCount,
    addImages,
    transformImages,
    removeImage,
    useManualQuality,
    setUseManualQuality,
  }
}

export default useImageTransform
