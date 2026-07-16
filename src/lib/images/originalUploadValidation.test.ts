import { describe, expect, it } from 'vitest'
import {
  MAX_ORIGINAL_UPLOAD_SIZE_BYTES,
  validateOriginalUpload,
} from './originalUploadValidation'

function file(bytes: number[], name: string, type = 'application/octet-stream'): File {
  return new File([new Uint8Array(bytes)], name, { type })
}

describe('validateOriginalUpload', () => {
  it('accepts a TIFF-based RAW source without decoding the full file', async () => {
    const source = file([0x49, 0x49, 0x2A, 0, 8, 0, 0, 0], 'photo.nef', 'image/x-nikon-nef')

    await expect(validateOriginalUpload(source)).resolves.toMatchObject({
      file: source,
      ext: 'nef',
      mime: 'application/octet-stream',
    })
  })

  it('accepts HEIC brands and normalizes an empty MIME type', async () => {
    const source = file([
      0,
      0,
      0,
      24,
      ...new TextEncoder().encode('ftyp'),
      ...new TextEncoder().encode('heic'),
      0,
      0,
      0,
      0,
      ...new TextEncoder().encode('mif1'),
    ], 'photo.heic', '')

    await expect(validateOriginalUpload(source)).resolves.toMatchObject({
      ext: 'heic',
      mime: 'image/heic',
    })
  })

  it('rejects a source whose extension and signature disagree', async () => {
    const source = file([0x89, 0x50, 0x4E, 0x47], 'photo.cr2')

    await expect(validateOriginalUpload(source)).rejects.toThrow('does not match')
  })

  it('rejects retained originals larger than the free-tier safety margin', async () => {
    const source = {
      name: 'photo.nef',
      size: MAX_ORIGINAL_UPLOAD_SIZE_BYTES + 1,
    } as File

    await expect(validateOriginalUpload(source)).rejects.toThrow('exceeds 90 MiB')
  })
})
