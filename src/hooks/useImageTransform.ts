import { useState } from 'react'
import { toast } from 'sonner'
import { checkImage, encodeImage, loadImageFromFile } from '@/lib/img'

const useImageTransform = () => {
  const [images, setImages] = useState<ImageFile[]>([])
  const [targetFormat, setTargetFormat] = useState<SupportedFormat>('webp')
  const [quality, setQuality] = useState<number>(80)
  const [isProcessing, setIsProcessing] = useState(false)
  const [useManualQuality, setUseManualQuality] = useState(false)

  const addImages = (files: File[]) => {
    const newImages = files.map((file) => {
      const { format, originalSize } = checkImage(file)
      return {
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        format,
        originalSize,
      }
    })
    setImages(prev => [...prev, ...newImages])
  }

  const transformImages = async () => {
    if (images.length === 0) {
      toast.error('Please add some images first')
      return
    }

    setIsProcessing(true)
    try {
      const transformedImages = await Promise.all(
        images.map(async (image) => {
          const imageData = await loadImageFromFile(image.file)
          if (!imageData) {
            throw new Error('Failed to load image')
          }
          const transformed = await encodeImage(imageData, targetFormat, useManualQuality ? quality : undefined)
          return {
            ...image,
            transformed: new Blob([transformed], { type: image.file.type }),
            targetFormat,
            compressedSize: transformed.byteLength,
          }
        }),
      )
      setImages(transformedImages.map(image => ({
        ...image,
        transformed: new Blob([image.transformed], { type: image.file.type }),
      })))
      toast.success('Images transformed successfully')
    }
    catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Transform error:', errorMessage)
      toast.error('Failed to transform images')
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
    addImages,
    transformImages,
    removeImage,
    useManualQuality,
    setUseManualQuality,
  }
}

export default useImageTransform
