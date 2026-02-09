import type { AlbumRecord } from '@/lib/storage/types'
import { createFileRoute } from '@tanstack/react-router'
import JSZip from 'jszip'
import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ImageList, ImageUploadArea, TransformControl } from '@/components/Home'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { listAlbumsFn } from '@/functions/albums'
import { getCurrentUserFn } from '@/functions/auth'
import { uploadImageFn } from '@/functions/images'
import { useImageTransform } from '@/hooks'
import { getImageDimensions } from '@/lib/images/dimensions'
import { normalizeImageMime } from '@/lib/storage/format'

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
  const [isAuthed, setIsAuthed] = useState(false)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [albums, setAlbums] = useState<AlbumRecord[]>([])
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>('')

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const currentUser = await getCurrentUserFn()
        if (!currentUser) {
          if (!cancelled) {
            setIsAuthed(false)
            setAlbums([])
            setSelectedAlbumId('')
          }
          return
        }

        if (cancelled) {
          return
        }
        setIsAuthed(true)

        const payload = await listAlbumsFn()
        if (!cancelled) {
          setAlbums(payload.albums)
          setSelectedAlbumId(payload.meta.defaultAlbumId)
        }
      }
      catch (error) {
        if (!cancelled) {
          setIsAuthed(false)
          toast.error('Failed to load account data', {
            description: error instanceof Error ? error.message : String(error),
          })
        }
      }
      finally {
        if (!cancelled) {
          setIsLoadingAuth(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

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

  const handleTransformAction = async () => {
    const transformed = await transformImages()
    if (!transformed || !isAuthed) {
      return
    }
    if (!selectedAlbumId) {
      toast.error('Please choose an album before uploading.')
      return
    }

    const uploadTargets = transformed.filter(image => image.transformed)
    if (uploadTargets.length === 0) {
      toast.error('No transformed images available to upload')
      return
    }

    setIsUploading(true)
    try {
      for (const image of uploadTargets) {
        const ext = image.targetFormat ?? targetFormat
        const fileNameBase = image.file.name.split('.').slice(0, -1).join('.') || image.file.name
        const fileName = `${fileNameBase}.${ext}`
        const blob = image.transformed as Blob
        const mime = normalizeImageMime(ext, blob.type)
        const file = new File([blob], fileName, { type: mime })
        const dimensions = await getImageDimensions(file)
        if (dimensions === null) {
          toast.warning('Could not read transformed image dimensions', {
            description: `Uploading ${file.name} without width/height metadata`,
          })
        }

        const formData = new FormData()
        formData.set('file', file)
        formData.set('albumId', selectedAlbumId)
        formData.set('source', 'index-compressed')
        formData.set('originalName', image.file.name)
        if (dimensions !== null) {
          formData.set('width', String(dimensions.width))
          formData.set('height', String(dimensions.height))
        }

        await uploadImageFn({ data: formData })
      }

      toast.success(`${uploadTargets.length} image(s) uploaded`)
    }
    catch (error) {
      toast.error('Failed to upload transformed images', {
        description: error instanceof Error ? error.message : String(error),
      })
    }
    finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center">Image Transformer</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <ImageUploadArea onDrop={addImages} />
          {!isLoadingAuth && isAuthed && (
            <Card className="mt-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Upload Album</CardTitle>
                <CardDescription>Compressed images will be stored in this album.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Label htmlFor="index-album-select">Album</Label>
                <Select
                  value={selectedAlbumId}
                  onValueChange={value => setSelectedAlbumId(value)}
                >
                  <SelectTrigger id="index-album-select" className="w-full">
                    <SelectValue placeholder="Choose album" />
                  </SelectTrigger>
                  <SelectContent>
                    {albums.map(album => (
                      <SelectItem key={album.id} value={album.id}>{album.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}
          <TransformControl
            targetFormat={targetFormat}
            setTargetFormat={setTargetFormat}
            quality={quality}
            setQuality={setQuality}
            isProcessing={isProcessing || isUploading}
            onTransform={() => void handleTransformAction()}
            hasImages={images.length > 0}
            useManualQuality={useManualQuality}
            setUseManualQuality={setUseManualQuality}
            actionLabel={isAuthed ? 'Compress & Upload' : 'Compress'}
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
