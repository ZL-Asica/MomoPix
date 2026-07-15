import { describe, expect, it } from 'vitest'
import { MAX_UPLOAD_SIZE_BYTES, parseUploadImage, validateUploadImage } from './uploadValidation'

function png(width: number, height: number): Uint8Array {
  return new Uint8Array([
    0x89,
    0x50,
    0x4E,
    0x47,
    0x0D,
    0x0A,
    0x1A,
    0x0A,
    0x00,
    0x00,
    0x00,
    0x0D,
    0x49,
    0x48,
    0x44,
    0x52,
    (width >>> 24) & 0xFF,
    (width >>> 16) & 0xFF,
    (width >>> 8) & 0xFF,
    width & 0xFF,
    (height >>> 24) & 0xFF,
    (height >>> 16) & 0xFF,
    (height >>> 8) & 0xFF,
    height & 0xFF,
  ])
}

describe('uploadValidation', () => {
  it('derives PNG dimensions and canonical MIME from binary content', () => {
    expect(parseUploadImage(png(1200, 800))).toEqual({
      mime: 'image/png',
      width: 1200,
      height: 800,
    })
  })

  it('rejects malformed headers and unsafe image dimensions', () => {
    expect(parseUploadImage(new Uint8Array([0x89, 0x50, 0x4E, 0x47]))).toBeNull()
    expect(parseUploadImage(png(32_769, 10))).toBeNull()
  })

  it('rejects a browser-declared MIME that does not match the file content', async () => {
    const file = new File([png(10, 10).buffer as ArrayBuffer], 'image.jpg', { type: 'image/jpeg' })

    await expect(validateUploadImage(file)).rejects.toThrow('does not match')
  })

  it('uses binary metadata instead of the upload filename', async () => {
    const file = new File([png(640, 480).buffer as ArrayBuffer], 'image.svg', { type: 'image/png' })

    await expect(validateUploadImage(file)).resolves.toMatchObject({
      mime: 'image/png',
      width: 640,
      height: 480,
    })
  })

  it('rejects files that exceed the server upload size limit before decoding', async () => {
    const file = new File([new ArrayBuffer(MAX_UPLOAD_SIZE_BYTES + 1)], 'large.png', { type: 'image/png' })

    await expect(validateUploadImage(file)).rejects.toThrow('exceeds 10 MiB')
  })
})
