import { withoutExtension } from '@/lib/storage/format'

const IMAGE_NAME_MAX_LENGTH = 120

function trimToMaxLength(value: string): string {
  return value.trim().slice(0, IMAGE_NAME_MAX_LENGTH)
}

function objectKeyBaseName(objectKey: string): string {
  const normalized = objectKey.trim().replace(/\/+$/, '')
  const lastSegment = normalized.split('/').pop() ?? ''
  const withoutExt = withoutExtension(lastSegment).trim()
  if (withoutExt.length > 0) {
    return withoutExt
  }
  return normalized
}

/**
 * Derives the default image name from an uploaded filename.
 *
 * Falls back to the object key segment when a filename cannot produce
 * a non-empty base name.
 */
export function deriveDefaultImageName(fileName: string, objectKey: string): string {
  const baseName = trimToMaxLength(withoutExtension(fileName))
  if (baseName.length > 0) {
    return baseName
  }
  return trimToMaxLength(objectKeyBaseName(objectKey))
}

/**
 * Resolves the display name for image rows, including legacy records
 * where `name` may be absent.
 */
export function resolveImageName(input: { name?: string | null, objectKey: string }): string {
  const fromRecord = trimToMaxLength(input.name ?? '')
  if (fromRecord.length > 0) {
    return fromRecord
  }
  return trimToMaxLength(objectKeyBaseName(input.objectKey))
}
