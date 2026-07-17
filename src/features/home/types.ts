/**
 * Lifecycle state for one image compression task.
 */
export type TransformStatus = 'idle' | 'compressing' | 'compressed' | 'original' | 'error'

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
  thumbnailPreviewUrl: string | null
  originalFormat: string
  targetFormat: SupportedFormat
  /** Final file to download or upload. Animated sources remain unchanged. */
  outputBlob: Blob | null
  outputFile: File | null
  outputSize: number | null
  /** Hosted derivative; may differ from the download output when the source is not host-compatible. */
  uploadFile: File | null
  width: number | null
  height: number | null
  sourceWidth: number | null
  sourceHeight: number | null
  thumbnailBlob: Blob | null
  thumbnailFile: File | null
  thumbnailSize: number | null
  thumbnailWidth: number | null
  thumbnailHeight: number | null
  retainOriginal: boolean
  status: TransformStatus
  transformError: string | null
  transformNotice: string | null
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
