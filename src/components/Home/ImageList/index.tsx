import { getListSummary } from '@/lib/img/get-list-summary'
import EmptyImageListState from './EmptyImageListState'
import ImageListHeader from './ImageListHeader'
import ImageListItem from './ImageListItem'

interface ImageListProps {
  images: ImageFile[]
  transformedImageCount: number
  isProcessing: boolean
  onDownload: (image: ImageFile) => void
  downloadingAll: boolean
  onDownloadAll: (images: ImageFile[]) => void
  onRemove: (id: string) => void
}

const ImageList = ({
  images,
  transformedImageCount,
  isProcessing,
  onDownload,
  downloadingAll,
  onDownloadAll,
  onRemove,
}: ImageListProps) => {
  if (images.length === 0) {
    return <EmptyImageListState />
  }

  const summary = getListSummary(images, transformedImageCount, isProcessing)

  return (
    <section aria-label="Image list" className="space-y-3">
      <ImageListHeader
        summary={summary}
        downloadingAll={downloadingAll}
        onDownloadAll={() => onDownloadAll(images)}
      />

      <div className="space-y-4" role="list">
        {images.map(image => (
          <ImageListItem
            key={image.id}
            image={image}
            onDownload={onDownload}
            onRemove={onRemove}
          />
        ))}
      </div>
    </section>
  )
}

export default ImageList
