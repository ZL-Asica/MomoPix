type SupportedFormat = 'avif' | 'webp' | 'jpeg' | 'png'

declare module 'libheif-js/wasm-bundle' {
  const module: unknown
  export default module
}

interface ImageFile {
  id: string
  file: File
  name: string
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

interface ImageStats {
  isTransformed: boolean
  compressedSize: number | null
  savedPercent: number // + - % the amount saved (or increased)
  sizePercent: number // The size relative to original size
  sourceFormat: string
  targetFormat?: string
  displayName: string
  savedLabel: string
  savedClassName: string
}

interface QualityPreset {
  min: number
  max: number
  note: string
}

interface QualityState {
  label: string
  description: string
  intentClass: string
}
