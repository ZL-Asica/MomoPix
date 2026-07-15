/** Maximum accepted upload size at the server trust boundary (10 MiB). */
export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024

const MAX_IMAGE_DIMENSION = 32_768
const MAX_IMAGE_PIXELS = 100_000_000
const JPEG_START_OF_FRAME_MARKERS = new Set([
  0xC0,
  0xC1,
  0xC2,
  0xC3,
  0xC5,
  0xC6,
  0xC7,
  0xC9,
  0xCA,
  0xCB,
  0xCD,
  0xCE,
  0xCF,
])

export type UploadImageMime
  = | 'image/avif'
    | 'image/bmp'
    | 'image/gif'
    | 'image/jpeg'
    | 'image/png'
    | 'image/webp'

export interface ValidatedUploadImage {
  bytes: ArrayBuffer
  mime: UploadImageMime
  width: number
  height: number
}

interface ParsedUploadImage {
  mime: UploadImageMime
  width: number
  height: number
}

function readU16BE(bytes: Uint8Array, offset: number): number | null {
  if (offset < 0 || offset + 2 > bytes.length) {
    return null
  }
  return (bytes[offset] << 8) | bytes[offset + 1]
}

function readU16LE(bytes: Uint8Array, offset: number): number | null {
  if (offset < 0 || offset + 2 > bytes.length) {
    return null
  }
  return bytes[offset] | (bytes[offset + 1] << 8)
}

function readU24LE(bytes: Uint8Array, offset: number): number | null {
  if (offset < 0 || offset + 3 > bytes.length) {
    return null
  }
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16)
}

function readU32BE(bytes: Uint8Array, offset: number): number | null {
  if (offset < 0 || offset + 4 > bytes.length) {
    return null
  }
  return ((bytes[offset] * 2 ** 24) + (bytes[offset + 1] << 16) + (bytes[offset + 2] << 8) + bytes[offset + 3]) >>> 0
}

function readI32LE(bytes: Uint8Array, offset: number): number | null {
  if (offset < 0 || offset + 4 > bytes.length) {
    return null
  }
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getInt32(offset, true)
}

function hasAscii(bytes: Uint8Array, offset: number, value: string): boolean {
  if (offset < 0 || offset + value.length > bytes.length) {
    return false
  }
  return [...value].every((character, index) => bytes[offset + index] === character.charCodeAt(0))
}

function toDimensions(width: number | null, height: number | null): { width: number, height: number } | null {
  if (
    width === null
    || height === null
    || width < 1
    || height < 1
    || width > MAX_IMAGE_DIMENSION
    || height > MAX_IMAGE_DIMENSION
    || width * height > MAX_IMAGE_PIXELS
  ) {
    return null
  }
  return { width, height }
}

function parsePng(bytes: Uint8Array): ParsedUploadImage | null {
  if (
    bytes.length < 24
    || bytes[0] !== 0x89
    || !hasAscii(bytes, 1, 'PNG')
    || bytes[4] !== 0x0D
    || bytes[5] !== 0x0A
    || bytes[6] !== 0x1A
    || bytes[7] !== 0x0A
    || !hasAscii(bytes, 12, 'IHDR')
  ) {
    return null
  }
  const dimensions = toDimensions(readU32BE(bytes, 16), readU32BE(bytes, 20))
  return dimensions === null ? null : { mime: 'image/png', ...dimensions }
}

function parseGif(bytes: Uint8Array): ParsedUploadImage | null {
  if (!hasAscii(bytes, 0, 'GIF87a') && !hasAscii(bytes, 0, 'GIF89a')) {
    return null
  }
  const dimensions = toDimensions(readU16LE(bytes, 6), readU16LE(bytes, 8))
  return dimensions === null ? null : { mime: 'image/gif', ...dimensions }
}

function parseBmp(bytes: Uint8Array): ParsedUploadImage | null {
  if (bytes[0] !== 0x42 || bytes[1] !== 0x4D) {
    return null
  }
  const height = readI32LE(bytes, 22)
  const dimensions = toDimensions(readI32LE(bytes, 18), height === null ? null : Math.abs(height))
  return dimensions === null ? null : { mime: 'image/bmp', ...dimensions }
}

function parseJpeg(bytes: Uint8Array): ParsedUploadImage | null {
  if (bytes[0] !== 0xFF || bytes[1] !== 0xD8 || bytes[2] !== 0xFF) {
    return null
  }

  let offset = 2
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xFF) {
      offset += 1
      continue
    }

    while (bytes[offset] === 0xFF) {
      offset += 1
    }
    const marker = bytes[offset]
    offset += 1

    if (marker === undefined || marker === 0xD8 || marker === 0xD9 || (marker >= 0xD0 && marker <= 0xD7)) {
      continue
    }

    const segmentLength = readU16BE(bytes, offset)
    if (segmentLength === null || segmentLength < 2 || offset + segmentLength > bytes.length) {
      return null
    }

    if (JPEG_START_OF_FRAME_MARKERS.has(marker)) {
      const dimensions = toDimensions(readU16BE(bytes, offset + 5), readU16BE(bytes, offset + 3))
      return dimensions === null ? null : { mime: 'image/jpeg', ...dimensions }
    }

    offset += segmentLength
  }

  return null
}

function parseWebp(bytes: Uint8Array): ParsedUploadImage | null {
  if (!hasAscii(bytes, 0, 'RIFF') || !hasAscii(bytes, 8, 'WEBP')) {
    return null
  }

  if (hasAscii(bytes, 12, 'VP8X')) {
    const width = readU24LE(bytes, 24)
    const height = readU24LE(bytes, 27)
    const dimensions = toDimensions(width === null ? null : width + 1, height === null ? null : height + 1)
    return dimensions === null ? null : { mime: 'image/webp', ...dimensions }
  }

  if (hasAscii(bytes, 12, 'VP8L') && bytes[20] === 0x2F) {
    const packed = readU32BE(bytes, 21)
    if (packed === null) {
      return null
    }
    const littleEndianPacked = ((packed & 0xFF) << 24) | ((packed & 0xFF00) << 8) | ((packed >>> 8) & 0xFF00) | ((packed >>> 24) & 0xFF)
    const dimensions = toDimensions((littleEndianPacked & 0x3FFF) + 1, ((littleEndianPacked >>> 14) & 0x3FFF) + 1)
    return dimensions === null ? null : { mime: 'image/webp', ...dimensions }
  }

  if (hasAscii(bytes, 12, 'VP8') && bytes[23] === 0x9D && bytes[24] === 0x01 && bytes[25] === 0x2A) {
    const width = readU16LE(bytes, 26)
    const height = readU16LE(bytes, 28)
    const dimensions = toDimensions(width === null ? null : width & 0x3FFF, height === null ? null : height & 0x3FFF)
    return dimensions === null ? null : { mime: 'image/webp', ...dimensions }
  }

  return null
}

function parseAvif(bytes: Uint8Array): ParsedUploadImage | null {
  if (!hasAscii(bytes, 4, 'ftyp')) {
    return null
  }
  const isAvif = hasAscii(bytes, 8, 'avif') || hasAscii(bytes, 8, 'avis')
    || hasAscii(bytes, 16, 'avif') || hasAscii(bytes, 16, 'avis')
  if (!isAvif) {
    return null
  }

  for (let offset = 0; offset + 16 <= bytes.length; offset += 1) {
    if (!hasAscii(bytes, offset, 'ispe')) {
      continue
    }
    const dimensions = toDimensions(readU32BE(bytes, offset + 8), readU32BE(bytes, offset + 12))
    return dimensions === null ? null : { mime: 'image/avif', ...dimensions }
  }

  return null
}

function normalizeDeclaredMime(mime: string): UploadImageMime | null {
  switch (mime.trim().toLowerCase()) {
    case 'image/apng':
    case 'image/png':
      return 'image/png'
    case 'image/avif':
    case 'image/bmp':
    case 'image/gif':
    case 'image/webp':
      return mime.trim().toLowerCase() as UploadImageMime
    case 'image/jpe':
    case 'image/jpg':
    case 'image/jpeg':
      return 'image/jpeg'
    default:
      return null
  }
}

/**
 * Parses a supported raster image's binary signature and intrinsic dimensions.
 *
 * @param bytes Complete image bytes.
 * @returns Canonical MIME and dimensions, or `null` for unsupported/invalid content.
 */
export function parseUploadImage(bytes: Uint8Array): ParsedUploadImage | null {
  return parsePng(bytes)
    ?? parseGif(bytes)
    ?? parseJpeg(bytes)
    ?? parseWebp(bytes)
    ?? parseBmp(bytes)
    ?? parseAvif(bytes)
}

/**
 * Validates an upload at the server boundary and derives trusted image metadata.
 *
 * The declared browser MIME type is checked when present, but the persisted MIME
 * and dimensions always come from the binary image data.
 *
 * @param file Uploaded file from `FormData`.
 * @returns Validated bytes and canonical metadata safe to persist.
 * @throws When the file is too large, unsupported, malformed, or MIME-mismatched.
 */
export async function validateUploadImage(file: File): Promise<ValidatedUploadImage> {
  if (file.size < 1) {
    throw new Error('Image file is empty')
  }
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error('Image size exceeds 10 MiB')
  }

  const bytes = await file.arrayBuffer()
  const parsed = parseUploadImage(new Uint8Array(bytes))
  if (parsed === null) {
    throw new Error('Unsupported or malformed image content')
  }

  const declaredMime = file.type.length > 0 ? normalizeDeclaredMime(file.type) : parsed.mime
  if (declaredMime === null || declaredMime !== parsed.mime) {
    throw new Error('Image MIME type does not match its binary content')
  }

  return {
    bytes,
    ...parsed,
  }
}
