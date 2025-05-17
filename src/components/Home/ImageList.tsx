import { Download, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface ImageListProps {
  images: ImageFile[]
  onDownload: (image: ImageFile) => void
  onRemove: (id: string) => void
}

const ImageList = ({
  images,
  onDownload,
  onRemove,
}: ImageListProps) => {
  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px] border-2 border-dashed rounded-lg border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">No images added yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4" role="list" aria-label="Image list">
      {images.map((image) => {
        const compressionRatio = image.compressedSize !== null && image.compressedSize !== undefined
          ? ((image.originalSize - image.compressedSize) / image.originalSize) * 100
          : 0

        return (
          <Card
            key={image.id}
            className="p-4 transition-all hover:shadow-md dark:bg-gray-800 dark:border-gray-700"
          >
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20">
                <img
                  src={image.preview}
                  alt={`Preview of ${image.file.name}`}
                  className="w-full h-full object-cover rounded-lg"
                  loading="lazy"
                />
                {image.transformed && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg opacity-0 hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => onDownload(image)}
                      className="bg-white/90 hover:bg-white"
                    >
                      <Download className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate dark:text-gray-100">
                  {image.compressedSize !== null
                    ? `${image.file.name.split('.').slice(0, -1).join('.')}.${image.targetFormat}`
                    : image.file.name}
                </p>
                <div className="mt-1 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">
                      {((image.compressedSize ?? image.originalSize) / 1024).toFixed(1)}
                      {' '}
                      KB
                    </span>
                    {image.compressedSize !== null && (
                      <span className={`${compressionRatio > 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'}`}
                      >
                        {compressionRatio > 0
                          ? 'Saved'
                          : 'Worsened'}
                        {' '}
                        {compressionRatio > 0
                          ? compressionRatio.toFixed(1)
                          : (-compressionRatio).toFixed(1)}
                        %
                      </span>
                    )}
                  </div>
                  {image.compressedSize !== null && (
                    <Progress
                      value={compressionRatio > 0
                        ? 100 - compressionRatio
                        : 100}
                      className="h-1.5"
                    />
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {image.transformed && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onDownload(image)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    aria-label={`Download ${image.file.name}`}
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onRemove(image.id)}
                  className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                  aria-label={`Remove ${image.file.name}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

export default ImageList
