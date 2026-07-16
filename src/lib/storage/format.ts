const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
  bmp: 'image/bmp',
  tiff: 'image/tiff',
  tif: 'image/tiff',
  heic: 'image/heic',
  heif: 'image/heif',
}

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/bmp': 'bmp',
  'image/tiff': 'tiff',
  'image/heic': 'heic',
  'image/heif': 'heif',
}

/**
 * Extracts the file extension from a filename.
 *
 * @param name Input filename.
 * @returns Lowercased extension without dot or `null` when absent.
 */
export function extractExtension(name: string): string | null {
  const segments = name.trim().split('.')
  if (segments.length < 2) {
    return null
  }

  const ext = segments.pop()?.toLowerCase().trim() ?? ''
  if (!ext) {
    return null
  }
  return ext
}

/**
 * Resolves a normalized extension from name or mime hints.
 *
 * @param name Source filename.
 * @param mimeType Optional MIME type hint.
 * @returns Normalized extension used by storage naming.
 */
export function normalizeImageExt(name: string, mimeType?: string | null): string {
  const hasMime = mimeType !== null && mimeType !== undefined && mimeType.trim().length > 0
  const fromMime = hasMime ? MIME_TO_EXT[mimeType.toLowerCase()] : undefined
  if (fromMime !== undefined) {
    return fromMime
  }

  const fromName = extractExtension(name)
  if (fromName !== null) {
    if (fromName === 'jpg') {
      return 'jpeg'
    }
    return fromName
  }

  return 'bin'
}

/**
 * Resolves a normalized mime type from extension or provided mime.
 *
 * @param ext Source file extension.
 * @param mimeType Optional MIME type override.
 * @returns Normalized MIME type.
 */
export function normalizeImageMime(ext: string, mimeType?: string | null): string {
  if (mimeType !== null && mimeType !== undefined && mimeType.trim().length > 0) {
    return mimeType.trim().toLowerCase()
  }
  return EXT_TO_MIME[ext.toLowerCase()] ?? 'application/octet-stream'
}

/**
 * Removes the last extension segment from a filename.
 *
 * @param name Source filename.
 * @returns Filename without trailing extension.
 */
export function withoutExtension(name: string): string {
  const segments = name.split('.')
  if (segments.length <= 1) {
    return name
  }
  return segments.slice(0, -1).join('.')
}

/**
 * Builds the storage/display filename while preserving base name.
 *
 * @param originalName Original uploaded filename.
 * @param ext Normalized output extension.
 * @returns Storage-safe filename with normalized extension.
 */
export function toStoredName(originalName: string, ext: string): string {
  const base = withoutExtension(originalName).trim()
  const safeBase = base.length > 0 ? base : 'image'
  return `${safeBase}.${ext}`
}

/**
 * Formats bytes to a compact human-readable value.
 *
 * @param bytes Raw byte count.
 * @returns Human-readable byte label.
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  const units = ['KB', 'MB', 'GB', 'TB']
  let value = bytes / 1024
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`
}
