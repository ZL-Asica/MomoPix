import { afterEach, describe, expect, it, vi } from 'vitest'
import { transformImageFile } from './transform-client'

function pngHeader(width: number, height: number): Uint8Array {
  return new Uint8Array([
    0x89,
    ...new TextEncoder().encode('PNG'),
    0x0D,
    0x0A,
    0x1A,
    0x0A,
    0,
    0,
    0,
    13,
    ...new TextEncoder().encode('IHDR'),
    (width >>> 24) & 0xFF,
    (width >>> 16) & 0xFF,
    (width >>> 8) & 0xFF,
    width & 0xFF,
    (height >>> 24) & 0xFF,
    (height >>> 16) & 0xFF,
    (height >>> 8) & 0xFF,
    height & 0xFF,
    8,
    6,
    0,
    0,
    0,
  ])
}

function pngFile(width = 640, height = 480): File {
  return new File([pngHeader(width, height).buffer as ArrayBuffer], 'input.png', { type: 'image/png' })
}

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

    const result = await transformImageFile(pngFile(), 'webp', 80)

    expect(result).toMatchObject({ mimeType: 'image/webp', width: 640, height: 480, preservedOriginal: false })
    expect(result.blob.type).toBe('image/webp')
    expect(drawImage).toHaveBeenCalledOnce()
    expect(close).toHaveBeenCalledOnce()
  })

  it('rejects a silent canvas fallback instead of mislabeling the output', async () => {
    const close = vi.fn()
    stubCanvas('image/png')
    vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ width: 640, height: 480, close })))

    const source = pngFile()
    await expect(transformImageFile(source, 'avif')).rejects.toThrow('This browser cannot encode images as AVIF')
    expect(close).toHaveBeenCalledOnce()
  })

  it('keeps animated GIFs unchanged instead of flattening them to one frame', async () => {
    const animatedGif = new Uint8Array([
      ...new TextEncoder().encode('GIF89a'),
      1,
      0,
      1,
      0,
      0,
      0,
      0,
      0x2C,
      0,
      0,
      0,
      0,
      1,
      0,
      1,
      0,
      0,
      2,
      2,
      0x4C,
      1,
      0,
      0x2C,
      0,
      0,
      0,
      0,
      1,
      0,
      1,
      0,
      0,
      2,
      2,
      0x4C,
      1,
      0,
      0x3B,
    ])
    const source = new File([animatedGif.buffer], 'animated.gif', { type: 'image/gif' })
    const createImageBitmap = vi.fn()
    vi.stubGlobal('createImageBitmap', createImageBitmap)

    const result = await transformImageFile(source, 'webp')

    expect(result).toMatchObject({
      blob: source,
      mimeType: 'image/gif',
      width: 1,
      height: 1,
      preservedOriginal: true,
    })
    expect(createImageBitmap).not.toHaveBeenCalled()
  })

  it('keeps APNGs unchanged instead of flattening them to one frame', async () => {
    const animatedPng = new Uint8Array([
      ...pngHeader(1, 1),
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      8,
      ...new TextEncoder().encode('acTL'),
      0,
      0,
      0,
      2,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
    ])
    const source = new File([animatedPng.buffer], 'animated.png', { type: 'image/apng' })
    const createImageBitmap = vi.fn()
    vi.stubGlobal('createImageBitmap', createImageBitmap)

    const result = await transformImageFile(source, 'webp')

    expect(result).toMatchObject({
      blob: source,
      mimeType: 'image/png',
      preservedOriginal: true,
    })
    expect(createImageBitmap).not.toHaveBeenCalled()
  })

  it('keeps animated WebP images unchanged instead of flattening them to one frame', async () => {
    const animatedWebp = new Uint8Array([
      ...new TextEncoder().encode('RIFF'),
      22,
      0,
      0,
      0,
      ...new TextEncoder().encode('WEBPVP8X'),
      10,
      0,
      0,
      0,
      0x02,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
    ])
    const source = new File([animatedWebp.buffer], 'animated.webp', { type: 'image/webp' })
    const createImageBitmap = vi.fn()
    vi.stubGlobal('createImageBitmap', createImageBitmap)

    const result = await transformImageFile(source, 'webp')

    expect(result).toMatchObject({
      blob: source,
      mimeType: 'image/webp',
      width: 1,
      height: 1,
      preservedOriginal: true,
    })
    expect(createImageBitmap).not.toHaveBeenCalled()
  })

  it('rejects oversized images before creating a canvas bitmap', async () => {
    const source = pngFile(8192, 8192)
    const createImageBitmap = vi.fn()
    vi.stubGlobal('createImageBitmap', createImageBitmap)

    await expect(transformImageFile(source, 'webp')).rejects.toThrow('24 megapixel transform limit')
    expect(createImageBitmap).not.toHaveBeenCalled()
  })
})
