type SupportedFormat = 'avif' | 'webp' | 'jpeg' | 'png'

interface ImageFile {
  id: string
  file: File
  preview: string
  format: string
  originalSize: number
  transformed?: Blob
  targetFormat?: string
  compressedSize?: number
}

interface ActionResponse {
  success: boolean
  message: string
}
