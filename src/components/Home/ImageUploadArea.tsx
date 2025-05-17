import { ImageIcon } from 'lucide-react'
import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card } from '@/components/ui/card'

interface ImageUploadAreaProps {
  onDrop: (files: File[]) => void
}

const ImageUploadArea = ({ onDrop }: ImageUploadAreaProps) => {
  const onDropCallback = useCallback((acceptedFiles: File[]) => {
    onDrop(acceptedFiles)
  }, [onDrop])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropCallback,
    accept: {
      'image/*': [],
    },
  })

  return (
    <Card className="p-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300 dark:border-gray-600 hover:border-primary'}`}
        role="button"
        tabIndex={0}
        aria-label="Upload images"
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
