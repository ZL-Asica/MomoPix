import { Download, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImageActionsProps {
  canDownload: boolean
  onDownload: () => void
  onRemove: () => void
  displayName: string
  originalFileName: string
}

const ImageActions = ({
  canDownload,
  onDownload,
  onRemove,
  displayName,
  originalFileName,
}: ImageActionsProps) => {
  return (
    <div className="flex shrink-0 gap-1">
      {canDownload && (
        <Button
          size="icon"
          variant="ghost"
          onClick={onDownload}
          className="h-8 w-8 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100"
          aria-label={`Download ${displayName}`}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
        </Button>
      )}
      <Button
        size="icon"
        variant="ghost"
        onClick={onRemove}
        className="h-8 w-8 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
        aria-label={`Remove ${originalFileName}`}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  )
}

export default ImageActions
