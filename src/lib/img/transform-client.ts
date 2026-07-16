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

interface WorkerTransformResult extends Omit<TransformImageResult, 'blob'> {
  blob: Blob | null
}

interface TransformWorkerResponse {
  id: number
  result?: WorkerTransformResult
  error?: string
}

interface PendingTransform {
  file: File
  resolve: (result: TransformImageResult) => void
  reject: (error: Error) => void
  timeoutId: ReturnType<typeof setTimeout>
}

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

    pending.resolve({
      ...event.data.result,
      blob: event.data.result.preservedOriginal
        ? pending.file
        : (event.data.result.blob ?? pending.file),
    })
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
    pendingTransforms.set(id, { file, resolve, reject, timeoutId })

    try {
      getTransformWorker().postMessage({
        id,
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
