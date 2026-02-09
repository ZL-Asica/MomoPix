import ImageUploadArea from '@/features/home/ImageUploadArea'

interface TransformDropzoneProps {
  onDrop: (files: File[]) => void
  disabled: boolean
}

/**
 * Presentational dropzone wrapper for home image input.
 */
export function TransformDropzone({ onDrop, disabled }: TransformDropzoneProps) {
  return <ImageUploadArea onDrop={onDrop} disabled={disabled} />
}
