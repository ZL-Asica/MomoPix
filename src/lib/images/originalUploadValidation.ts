import { extractExtension, normalizeImageMime } from '@/lib/storage/format'

/** Largest optional source asset accepted by the free-tier upload path. */
export const MAX_ORIGINAL_UPLOAD_SIZE_BYTES = 90 * 1024 * 1024

/** Combined derivative/original bytes allowed before multipart overhead. */
export const MAX_UPLOAD_ASSET_BYTES = 95 * 1024 * 1024

const RAW_EXTENSIONS = new Set([
  '3fr',
  'arw',
  'cr2',
  'cr3',
  'dng',
  'erf',
  'iiq',
  'kdc',
  'mos',
  'nef',
  'nrw',
  'orf',
  'pef',
  'raf',
  'raw',
  'rw2',
  'sr2',
  'srf',
])

const SOURCE_EXTENSIONS = new Set([
  'avif',
  'bmp',
  'gif',
  'heic',
  'heif',
  'jpeg',
  'jpg',
  'png',
  'tif',
  'tiff',
  'webp',
  ...RAW_EXTENSIONS,
])

function hasAscii(bytes: Uint8Array, offset: number, value: string): boolean {
  return offset >= 0
    && offset + value.length <= bytes.length
    && [...value].every((character, index) => bytes[offset + index] === character.charCodeAt(0))
}

function hasTiffSignature(bytes: Uint8Array): boolean {
  return (hasAscii(bytes, 0, 'II') && (
    (bytes[2] === 0x2A && bytes[3] === 0)
    || (bytes[2] === 0x52 && bytes[3] === 0x4F)
    || (bytes[2] === 0x55 && bytes[3] === 0)
  )) || (hasAscii(bytes, 0, 'MM') && (
    (bytes[2] === 0 && bytes[3] === 0x2A)
    || (bytes[2] === 0x4F && bytes[3] === 0x52)
  ))
}

function hasIsoBrand(bytes: Uint8Array, brands: readonly string[]): boolean {
  if (!hasAscii(bytes, 4, 'ftyp')) {
    return false
  }
  return brands.some(brand => hasAscii(bytes, 8, brand) || hasAscii(bytes, 16, brand))
}

function signatureMatchesExtension(bytes: Uint8Array, ext: string): boolean {
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF
    case 'png':
      return bytes[0] === 0x89 && hasAscii(bytes, 1, 'PNG')
    case 'gif':
      return hasAscii(bytes, 0, 'GIF87a') || hasAscii(bytes, 0, 'GIF89a')
    case 'bmp':
      return hasAscii(bytes, 0, 'BM')
    case 'webp':
      return hasAscii(bytes, 0, 'RIFF') && hasAscii(bytes, 8, 'WEBP')
    case 'avif':
      return hasIsoBrand(bytes, ['avif', 'avis'])
    case 'heic':
    case 'heif':
      return hasIsoBrand(bytes, ['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'])
    case 'cr3':
      return hasIsoBrand(bytes, ['crx ', 'crx2'])
    case 'raf':
      return hasAscii(bytes, 0, 'FUJIFILMCCD-RAW')
    case 'tif':
    case 'tiff':
      return hasTiffSignature(bytes)
    default:
      return RAW_EXTENSIONS.has(ext) && hasTiffSignature(bytes)
  }
}

export interface ValidatedOriginalUpload {
  file: File
  ext: string
  mime: string
}

/**
 * Validates an optional retained source without decoding its full pixel buffer.
 *
 * @param file Original browser upload.
 * @returns Normalized storage metadata and the streamable source file.
 * @throws When size, extension, declared MIME, or binary signature is invalid.
 */
export async function validateOriginalUpload(file: File): Promise<ValidatedOriginalUpload> {
  if (file.size < 1) {
    throw new Error('Original image is empty')
  }
  if (file.size > MAX_ORIGINAL_UPLOAD_SIZE_BYTES) {
    throw new Error('Original image exceeds 90 MiB')
  }

  const ext = extractExtension(file.name)?.toLowerCase() ?? ''
  if (!SOURCE_EXTENSIONS.has(ext)) {
    throw new Error('Unsupported original image format')
  }

  const header = new Uint8Array(await file.slice(0, 64).arrayBuffer())
  if (!signatureMatchesExtension(header, ext)) {
    throw new Error('Original image extension does not match its binary content')
  }

  // Do not persist a browser-declared MIME for an opaque retained source. The
  // extension has already been matched to the binary signature, and deriving
  // the type prevents an authenticated caller from storing active content types.
  const normalizedMime = RAW_EXTENSIONS.has(ext)
    ? 'application/octet-stream'
    : normalizeImageMime(ext)

  return {
    file,
    ext: ext === 'jpg' ? 'jpeg' : ext,
    mime: normalizedMime,
  }
}
