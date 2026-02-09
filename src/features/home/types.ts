/**
 * Lifecycle state for one image compression task.
 */
export type TransformStatus = 'idle' | 'compressing' | 'compressed' | 'error'

/**
 * Lifecycle state for one image upload task.
 */
export type UploadStatus = 'idle' | 'uploading' | 'uploaded' | 'error'

/**
 * Aggregate state for batch compression on the home page.
 */
export type CompressionState = 'idle' | 'compressing' | 'success' | 'error'

/**
 * Aggregate state for batch upload on the home page.
 */
export type UploadState = 'idle' | 'uploading' | 'success' | 'error'

/**
 * One client-side image row tracked by the home page flow.
 */
export interface HomeProcessedItem {
  id: string
  originalFile: File
  originalName: string
  originalSize: number
  originalPreviewUrl: string
  targetFormat: SupportedFormat
  compressedBlob: Blob | null
  compressedFile: File | null
  compressedSize: number | null
  width: number | null
  height: number | null
  status: TransformStatus
  transformError: string | null
  uploadStatus: UploadStatus
  uploadError: string | null
  uploadedUrl: string | null
  uploadedObjectKey: string | null
  uploadedAlbumId: string | null
  selected: boolean
}

/**
 * Upload summary used by UI status and toast messaging.
 */
export interface UploadSummary {
  total: number
  succeeded: number
  failed: number
}
