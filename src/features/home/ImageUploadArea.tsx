import { ImageIcon } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card } from '@/components/ui/card'

interface ImageUploadAreaProps {
  onDrop: (files: File[]) => void
  disabled?: boolean
}

const IMAGE_DROPZONE_ACCEPT = {
  'image/*': [],
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
    <Card className="p-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors
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
      </div>
    </Card>
  )
}

export default ImageUploadArea
