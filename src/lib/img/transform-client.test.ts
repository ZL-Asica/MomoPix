import { afterEach, describe, expect, it, vi } from 'vitest'
import { transformImageFile } from './transform-client'

function stubCanvas(outputType: string) {
  const drawImage = vi.fn()
  vi.stubGlobal('document', {
    createElement: vi.fn(() => ({
      width: 0,
      height: 0,
      getContext: () => ({ drawImage }),
      toBlob: (callback: BlobCallback) => callback(new Blob(['output'], { type: outputType })),
    })),
  })
  return drawImage
}

describe('transformImageFile', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the requested format and closes the decoded bitmap', async () => {
    const close = vi.fn()
    const drawImage = stubCanvas('image/webp')
    vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ width: 640, height: 480, close })))

    const result = await transformImageFile(new File(['input'], 'input.png', { type: 'image/png' }), 'webp', 80)

    expect(result).toMatchObject({ mimeType: 'image/webp', width: 640, height: 480 })
    expect(result.blob.type).toBe('image/webp')
    expect(drawImage).toHaveBeenCalledOnce()
    expect(close).toHaveBeenCalledOnce()
  })

  it('rejects a silent canvas fallback instead of mislabeling the output', async () => {
    const close = vi.fn()
    stubCanvas('image/png')
    vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ width: 640, height: 480, close })))

    const source = new File(['input'], 'input.png', { type: 'image/png' })
    await expect(transformImageFile(source, 'avif')).rejects.toThrow('This browser cannot encode images as AVIF')
    expect(close).toHaveBeenCalledOnce()
  })
})
