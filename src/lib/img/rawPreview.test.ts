import { describe, expect, it } from 'vitest'
import { extractRawPreview } from './rawPreview'

function createTiffRawWithPreview(preview: Uint8Array): Uint8Array {
  const previewOffset = 38
  const bytes = new Uint8Array(previewOffset + preview.byteLength)
  const view = new DataView(bytes.buffer)

  bytes.set([0x49, 0x49, 0x2A, 0x00])
  view.setUint32(4, 8, true)
  view.setUint16(8, 2, true)

  view.setUint16(10, 513, true)
  view.setUint16(12, 4, true)
  view.setUint32(14, 1, true)
  view.setUint32(18, previewOffset, true)

  view.setUint16(22, 514, true)
  view.setUint16(24, 4, true)
  view.setUint32(26, 1, true)
  view.setUint32(30, preview.byteLength, true)
  view.setUint32(34, 0, true)
  bytes.set(preview, previewOffset)
  return bytes
}

describe('extractRawPreview', () => {
  it('extracts the embedded JPEG bytes from a TIFF-based RAW container', async () => {
    const jpeg = new Uint8Array([0xFF, 0xD8, 0xFF, 0xDB, 0xFF, 0xD9])

    await expect(extractRawPreview(createTiffRawWithPreview(jpeg))).resolves.toEqual(jpeg)
  })

  it('rejects sources without a compatible TIFF RAW header', async () => {
    await expect(extractRawPreview(new Uint8Array([1, 2, 3, 4]))).rejects.toThrow(
      'No compatible embedded JPEG preview was found',
    )
  })

  it('extracts the largest JPEG preview from a non-TIFF vendor container', async () => {
    const smallJpeg = [0xFF, 0xD8, 0xFF, 0xD9]
    const largeJpeg = [0xFF, 0xD8, 0xFF, 1, 2, 3, 0xFF, 0xD9]
    const vendorRaw = new Uint8Array([1, 2, ...smallJpeg, 3, 4, ...largeJpeg, 5])

    await expect(extractRawPreview(vendorRaw)).resolves.toEqual(new Uint8Array(largeJpeg))
  })

  it('recognizes a preview whose EOI marker ends the container', async () => {
    const jpeg = new Uint8Array([0xFF, 0xD8, 0xFF, 1, 2, 0xFF, 0xD9])

    await expect(extractRawPreview(jpeg)).resolves.toEqual(jpeg)
  })
})
