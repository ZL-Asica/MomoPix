import { Download } from 'lucide-react'

interface ImagePreviewProps {
  image: ImageFile
  isTransformed: boolean
  displayName: string
  onDownload: () => void
}

const ImagePreview = ({
  image,
  isTransformed,
  displayName,
  onDownload,
}: ImagePreviewProps) => {
  return (
    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
      {/* eslint-disable-next-line next/no-img-element */}
      <img
        src={image.preview}
        alt={`Preview of ${image.file.name}`}
        className="h-full w-full object-cover"
      />
      {isTransformed && (
        <button
          type="button"
          onClick={onDownload}
          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100"
          aria-label={`Download ${displayName}`}
        >
          <div className="rounded-full bg-white/90 p-2 shadow">
            <Download className="h-4 w-4 text-gray-800" aria-hidden="true" />
          </div>
        </button>
      )}
    </div>
  )
}

export default ImagePreview
