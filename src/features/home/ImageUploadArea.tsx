import { ImageIcon } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card } from '@/components/ui/card'
import { MAX_QUEUE_ITEMS, MAX_QUEUE_SOURCE_BYTES } from '@/features/home/lib/memoryBudget'
import { getHumanReadableFileSize } from '@/utils/converter'

interface ImageUploadAreaProps {
  onDrop: (files: File[]) => void
  disabled?: boolean
}

const IMAGE_DROPZONE_ACCEPT = {
  'image/*': [],
  'image/heic': ['.heic'],
  'image/heif': ['.heif'],
  'image/tiff': ['.tif', '.tiff'],
  'application/octet-stream': [
    '.3fr',
    '.arw',
    '.cr2',
    '.cr3',
    '.dng',
    '.erf',
    '.iiq',
    '.kdc',
    '.mos',
    '.nef',
    '.nrw',
    '.orf',
    '.pef',
    '.raf',
    '.raw',
    '.rw2',
    '.sr2',
    '.srf',
  ],
} as const

const ImageUploadArea = ({ onDrop, disabled = false }: ImageUploadAreaProps) => {
  const onDropCallback = useCallback((acceptedFiles: File[]) => {
    onDrop(acceptedFiles)
  }, [onDrop])

  const dropzoneOptions = useMemo(() => ({
    onDrop: onDropCallback,
    disabled,
    accept: IMAGE_DROPZONE_ACCEPT,
  }), [disabled, onDropCallback])

  // Keep dropzone options referentially stable to avoid internal effect/setState loops.
  const { getRootProps, getInputProps, isDragActive } = useDropzone(dropzoneOptions)

  return (
    <Card className="p-4 sm:p-6">
      <div
        {...getRootProps()}
        className={`flex min-h-55 flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors sm:min-h-65 sm:p-10 md:min-h-75 md:p-12
          ${disabled
      ? 'cursor-not-allowed opacity-60 border-gray-200 dark:border-gray-700'
      : isDragActive
        ? 'cursor-pointer border-primary bg-primary/10'
        : 'cursor-pointer border-gray-300 dark:border-gray-600 hover:border-primary'}`}
        role="button"
        tabIndex={0}
        aria-label="Upload images"
        aria-disabled={disabled}
      >
        <input {...getInputProps()} aria-label="Select images to upload" />
        <ImageIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" aria-hidden="true" />
        <p className="mt-2 text-sm text-gray-600">
          {isDragActive
            ? 'Drop the images here'
            : 'Drag and drop images here, or click to select files'}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Up to
          {' '}
          {MAX_QUEUE_ITEMS}
          {' images or '}
          {getHumanReadableFileSize(MAX_QUEUE_SOURCE_BYTES)}
          {' per queue'}
        </p>
      </div>
    </Card>
  )
}

export default ImageUploadArea
