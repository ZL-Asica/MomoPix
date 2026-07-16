export { MAX_TRANSFORM_PIXELS, THUMBNAIL_MAX_EDGE } from './constants'

/** Normalized image transform error returned to UI. */
export interface TransformError {
  message: string
}

export interface TransformImageResult {
  blob: Blob
  mimeType: string
  width: number
  height: number
  sourceWidth: number
  sourceHeight: number
  thumbnailBlob: Blob
  thumbnailWidth: number
  thumbnailHeight: number
  preservedOriginal: boolean
  sourceNotice: string | null
}

export interface TransformThumbnailResult {
  blob: Blob
  width: number
  height: number
}

interface WorkerFullTransformResult extends Omit<TransformImageResult, 'blob'> {
  mode: 'full'
  blob: Blob | null
}

interface WorkerThumbnailTransformResult {
  mode: 'thumbnail'
  blob: Blob
  width: number
  height: number
}

type WorkerTransformResult = WorkerFullTransformResult | WorkerThumbnailTransformResult

interface TransformWorkerResponse {
  id: number
  result?: WorkerTransformResult
  error?: string
}

interface PendingFullTransform {
  mode: 'full'
  file: File
  resolve: (result: TransformImageResult) => void
  reject: (error: Error) => void
  timeoutId: ReturnType<typeof setTimeout>
}

interface PendingThumbnailTransform {
  mode: 'thumbnail'
  resolve: (result: TransformThumbnailResult) => void
  reject: (error: Error) => void
  timeoutId: ReturnType<typeof setTimeout>
}

type PendingTransform = PendingFullTransform | PendingThumbnailTransform

let transformWorker: Worker | null = null
let nextTransformId = 0
const pendingTransforms = new Map<number, PendingTransform>()
let workerIdleTimer: ReturnType<typeof setTimeout> | null = null

const WORKER_IDLE_TIMEOUT_MS = 30_000
const TRANSFORM_TIMEOUT_MS = 90_000

function clearWorkerIdleTimer(): void {
  if (workerIdleTimer !== null) {
    clearTimeout(workerIdleTimer)
    workerIdleTimer = null
  }
}

function scheduleWorkerTermination(): void {
  clearWorkerIdleTimer()
  const worker = transformWorker
  if (worker === null || pendingTransforms.size > 0) {
    return
  }
  workerIdleTimer = setTimeout(() => {
    if (transformWorker === worker && pendingTransforms.size === 0) {
      worker.terminate()
      transformWorker = null
    }
    workerIdleTimer = null
  }, WORKER_IDLE_TIMEOUT_MS)
}

function rejectPendingTransforms(message: string): void {
  for (const pending of pendingTransforms.values()) {
    clearTimeout(pending.timeoutId)
    pending.reject(new Error(message))
  }
  pendingTransforms.clear()
}

function getTransformWorker(): Worker {
  clearWorkerIdleTimer()
  if (transformWorker !== null) {
    return transformWorker
  }

  const worker = new Worker(new URL('./transform.worker.ts', import.meta.url), {
    type: 'module',
  })

  worker.addEventListener('message', (event: MessageEvent<TransformWorkerResponse>) => {
    const pending = pendingTransforms.get(event.data.id)
    if (!pending) {
      return
    }
    pendingTransforms.delete(event.data.id)
    clearTimeout(pending.timeoutId)

    if (event.data.error !== undefined) {
      pending.reject(new Error(event.data.error))
      scheduleWorkerTermination()
      return
    }
    if (event.data.result === undefined) {
      pending.reject(new Error('Image worker returned an invalid result'))
      scheduleWorkerTermination()
      return
    }

    const result = event.data.result
    if (pending.mode === 'thumbnail' && result.mode === 'thumbnail') {
      pending.resolve({ blob: result.blob, width: result.width, height: result.height })
      scheduleWorkerTermination()
      return
    }
    if (pending.mode === 'full' && result.mode === 'full') {
      pending.resolve({
        ...result,
        blob: result.preservedOriginal
          ? pending.file
          : (result.blob ?? pending.file),
      })
      scheduleWorkerTermination()
      return
    }
    pending.reject(new Error('Image worker returned a mismatched result'))
    scheduleWorkerTermination()
  })

  worker.addEventListener('error', () => {
    clearWorkerIdleTimer()
    rejectPendingTransforms('Image worker stopped unexpectedly')
    worker.terminate()
    transformWorker = null
  })

  transformWorker = worker
  return worker
}

/**
 * Converts one input into a hosted image plus a dedicated WebP thumbnail.
 *
 * Pixel decoding and encoding run in a module worker so large or slow codecs do
 * not block UI interaction. Codecs for HEIC, TIFF, RAW, and AVIF are loaded only
 * when the selected input/output requires them.
 */
export async function transformImageFile(
  file: File,
  format: SupportedFormat,
  quality?: number,
): Promise<TransformImageResult> {
  return new Promise((resolve, reject) => {
    const id = nextTransformId
    nextTransformId += 1
    const timeoutId = setTimeout(() => {
      clearWorkerIdleTimer()
      transformWorker?.terminate()
      transformWorker = null
      rejectPendingTransforms('Image transform timed out. Try a smaller or different source file.')
    }, TRANSFORM_TIMEOUT_MS)
    pendingTransforms.set(id, { mode: 'full', file, resolve, reject, timeoutId })

    try {
      getTransformWorker().postMessage({
        id,
        mode: 'full',
        file,
        format,
        quality,
      })
    }
    catch (error) {
      const pending = pendingTransforms.get(id)
      if (pending !== undefined) {
        clearTimeout(pending.timeoutId)
        pendingTransforms.delete(id)
      }
      reject(error instanceof Error ? error : new Error(String(error)))
    }
  })
}

/** Generates only the album WebP thumbnail, skipping the full-size encode. */
export async function generateImageThumbnail(file: File): Promise<TransformThumbnailResult> {
  return new Promise((resolve, reject) => {
    const id = nextTransformId
    nextTransformId += 1
    const timeoutId = setTimeout(() => {
      clearWorkerIdleTimer()
      transformWorker?.terminate()
      transformWorker = null
      rejectPendingTransforms('Image transform timed out. Try a smaller or different source file.')
    }, TRANSFORM_TIMEOUT_MS)
    pendingTransforms.set(id, { mode: 'thumbnail', resolve, reject, timeoutId })

    try {
      getTransformWorker().postMessage({ id, mode: 'thumbnail', file })
    }
    catch (error) {
      const pending = pendingTransforms.get(id)
      if (pending !== undefined) {
        clearTimeout(pending.timeoutId)
        pendingTransforms.delete(id)
      }
      reject(error instanceof Error ? error : new Error(String(error)))
    }
  })
}

/** Maps unknown transform failures to user-safe error messages. */
export function normalizeTransformError(error: unknown): TransformError {
  if (error instanceof Error) {
    return { message: error.message }
  }
  if (typeof error === 'string') {
    return { message: error }
  }
  return { message: 'Image transform failed. Please try a different file or format.' }
}
