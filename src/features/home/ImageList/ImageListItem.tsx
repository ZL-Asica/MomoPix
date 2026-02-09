import { Card } from '@/components/ui/card'
import { getImageStats } from '@/lib/img/getImage-stats'
import ImageActions from './ImageActions'
import ImageCompressionInfo from './ImageCompressionInfo'
import ImageMeta from './ImageMeta'
import ImagePreview from './ImagePreview'

interface ImageListItemProps {
  image: ImageFile
  onDownload: (image: ImageFile) => void
  onRemove: (id: string) => void
}

const ImageListItem = ({ image, onDownload, onRemove }: ImageListItemProps) => {
  const stats = getImageStats(image)

  return (
    <Card
      role="listitem"
      className="border border-gray-100 p-4 sm:p-5 transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900/70"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <ImagePreview
          image={image}
          isTransformed={stats.isTransformed}
          displayName={stats.displayName}
          onDownload={() => onDownload(image)}
        />

        <div className="min-w-0 flex-1 space-y-3">
          {/* Top: Meta + Actions */}
          <div className="flex items-start justify-between gap-3">
            <ImageMeta
              displayName={stats.displayName}
              sourceFormat={stats.sourceFormat}
              targetFormat={stats.targetFormat}
              originalSize={image.originalSize}
              compressedSize={stats.compressedSize}
            />
            <ImageActions
              canDownload={stats.isTransformed}
              onDownload={() => onDownload(image)}
              onRemove={() => onRemove(image.id)}
              displayName={stats.displayName}
              originalFileName={image.file.name}
            />
          </div>

          {/* Bottom: Compression Info */}
          <ImageCompressionInfo stats={stats} />
        </div>
      </div>
    </Card>
  )
}

export default ImageListItem
