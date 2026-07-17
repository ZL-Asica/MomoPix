import { afterEach, describe, expect, it, vi } from 'vitest'

interface WorkerRequest {
  id: number
  mode: 'full' | 'thumbnail'
  file: File
  format?: SupportedFormat
  quality?: number
}

class FakeWorker {
  static response: (request: WorkerRequest) => unknown
  static lastRequest: WorkerRequest | null = null
  static shouldRespond = true
  static terminatedCount = 0

  private messageListener: ((event: MessageEvent) => void) | null = null

  addEventListener(type: string, listener: EventListener): void {
    if (type === 'message') {
      this.messageListener = listener as (event: MessageEvent) => void
    }
  }

  postMessage(request: WorkerRequest): void {
    FakeWorker.lastRequest = request
    if (!FakeWorker.shouldRespond) {
      return
    }
    queueMicrotask(() => {
      this.messageListener?.({ data: FakeWorker.response(request) } as MessageEvent)
    })
  }

  terminate(): void {
    FakeWorker.terminatedCount += 1
  }
}

function workerResult(request: WorkerRequest, overrides: Record<string, unknown> = {}) {
  return {
    id: request.id,
    result: {
      mode: 'full',
      blob: new Blob(['hosted'], { type: 'image/webp' }),
      mimeType: 'image/webp',
      width: 640,
      height: 480,
      sourceWidth: 640,
      sourceHeight: 480,
      thumbnailBlob: new Blob(['thumbnail'], { type: 'image/webp' }),
      thumbnailWidth: 512,
      thumbnailHeight: 384,
      preservedOriginal: false,
      resizedToPixelBudget: false,
      sourceNotice: null,
      ...overrides,
    },
  }
}

async function loadTransformModule() {
  vi.resetModules()
  vi.stubGlobal('Worker', FakeWorker)
  return import('./transform-client')
}

describe('transformImageFile', () => {
  afterEach(() => {
    FakeWorker.lastRequest = null
    FakeWorker.shouldRespond = true
    FakeWorker.terminatedCount = 0
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('returns hosted and WebP thumbnail worker outputs', async () => {
    FakeWorker.response = request => workerResult(request)
    const { transformImageFile } = await loadTransformModule()
    const source = new File(['source'], 'input.png', { type: 'image/png' })

    const result = await transformImageFile(source, 'webp', 80)

    expect(FakeWorker.lastRequest).toMatchObject({ mode: 'full', file: source, format: 'webp', quality: 80 })
    expect(result).toMatchObject({
      mimeType: 'image/webp',
      width: 640,
      height: 480,
      thumbnailWidth: 512,
      thumbnailHeight: 384,
      preservedOriginal: false,
    })
    expect(result.blob.type).toBe('image/webp')
    expect(result.thumbnailBlob.type).toBe('image/webp')
  })

  it('keeps an animated flag while returning its hosted derivative', async () => {
    const hosted = new Blob(['static-frame'], { type: 'image/webp' })
    FakeWorker.response = request => workerResult(request, {
      blob: hosted,
      preservedOriginal: true,
    })
    const { transformImageFile } = await loadTransformModule()
    const source = new File(['source'], 'animated.gif', { type: 'image/gif' })

    const result = await transformImageFile(source, 'webp')

    expect(result.blob).toBe(hosted)
    expect(result.preservedOriginal).toBe(true)
    expect(result.thumbnailBlob.type).toBe('image/webp')
  })

  it('rejects normalized worker errors', async () => {
    FakeWorker.response = request => ({ id: request.id, error: 'Unsupported RAW camera' })
    const { transformImageFile } = await loadTransformModule()
    const source = new File(['source'], 'input.raw', { type: 'application/octet-stream' })

    await expect(transformImageFile(source, 'webp')).rejects.toThrow('Unsupported RAW camera')
  })

  it('requests only a WebP thumbnail for maintenance work', async () => {
    FakeWorker.response = request => ({
      id: request.id,
      result: {
        mode: 'thumbnail',
        blob: new Blob(['thumbnail'], { type: 'image/webp' }),
        width: 512,
        height: 384,
      },
    })
    const { generateImageThumbnail } = await loadTransformModule()
    const source = new File(['source'], 'legacy.jpg', { type: 'image/jpeg' })

    const result = await generateImageThumbnail(source)

    expect(FakeWorker.lastRequest).toMatchObject({ mode: 'thumbnail', file: source })
    expect(FakeWorker.lastRequest).not.toHaveProperty('format')
    expect(result).toMatchObject({ width: 512, height: 384 })
    expect(result.blob.type).toBe('image/webp')
  })

  it('terminates a stalled worker and rejects queued transforms', async () => {
    vi.useFakeTimers()
    FakeWorker.shouldRespond = false
    const { transformImageFile } = await loadTransformModule()
    const source = new File(['source'], 'input.png', { type: 'image/png' })

    const rejection = expect(transformImageFile(source, 'webp')).rejects.toThrow(
      'Image transform timed out. Try a smaller or different source file.',
    )
    await vi.advanceTimersByTimeAsync(90_000)

    await rejection
    expect(FakeWorker.terminatedCount).toBe(1)
  })
})
