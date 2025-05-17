'use client'

import { ImageList, ImageUploadArea, TransformControls } from '@/components/Home'
import { useImageTransform } from '@/hooks'

export default function Home() {
  const {
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
  } = useImageTransform()

  const handleDownload = (image: ImageFile) => {
    if (!image.transformed) {
      return
    }
    const url = URL.createObjectURL(image.transformed)
    const a = document.createElement('a')
    a.href = url
    a.download = `transformed.${targetFormat}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center">Image Transformer</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <ImageUploadArea onDrop={addImages} />
          <TransformControls
            targetFormat={targetFormat}
            setTargetFormat={setTargetFormat}
            quality={quality}
            setQuality={setQuality}
            isProcessing={isProcessing}
            onTransform={() => void transformImages()}
            hasImages={images.length > 0}
            useManualQuality={useManualQuality}
            setUseManualQuality={setUseManualQuality}
          />
        </div>
        <ImageList
          images={images}
          onDownload={handleDownload}
          onRemove={removeImage}
        />
      </div>
    </div>
  )
}
