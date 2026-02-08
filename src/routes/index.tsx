import { createFileRoute } from '@tanstack/react-router'
import JSZip from 'jszip'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { ImageList, ImageUploadArea, TransformControl } from '@/components/Home'
import { useImageTransform } from '@/hooks'

export const Route = createFileRoute('/')({ component: HomePage })

function HomePage() {
  const [downloadingAll, startDownloadingAll] = useTransition()

  const {
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
  } = useImageTransform()

  const handleDownload = (image: ImageFile) => {
    if (!image.transformed) {
      return
    }
    const cleanedRawName = image.file.name.split('.').slice(0, -1).join('.')
    const url = URL.createObjectURL(image.transformed)
    const a = document.createElement('a')
    a.href = url
    a.download = `${cleanedRawName}.${targetFormat}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(`Downloaded ${cleanedRawName}.${targetFormat}`)
  }

  const handleDownloadAll = (images: ImageFile[]) => {
    startDownloadingAll(async () => {
      const zip = new JSZip()

      const transformed = images.filter(img => img.transformed)

      if (transformed.length === 0) {
        return
      }

      for (const image of transformed) {
        const ext = image.targetFormat ?? targetFormat
        const baseName
          = image.name.split('.').slice(0, -1).join('.') || image.name

        const fileName = `${baseName}.${ext}`
        const blob = image.transformed as Blob

        zip.file(fileName, blob)
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' })

      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `images-${new Date().toISOString().slice(0, 10)}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Images zip package successfully downloaded!')
    })
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center">Image Transformer</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <ImageUploadArea onDrop={addImages} />
          <TransformControl
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
          transformedImageCount={transformedImageCount}
          isProcessing={isProcessing}
          onDownload={handleDownload}
          downloadingAll={downloadingAll}
          onDownloadAll={handleDownloadAll}
          onRemove={removeImage}
        />
      </div>
    </div>
  )
}
