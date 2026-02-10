export type ImageCopyFormat = 'direct' | 'html' | 'markdown'

/**
 * Minimal shape required to generate one clipboard line for an image.
 */
export interface ImageCopyRow {
  name: string
  publicUrl: string | null
}

/**
 * Labels and toast copy attached to one supported copy format.
 */
export interface ImageCopyFormatMeta {
  format: ImageCopyFormat
  menuLabel: string
  copyActionLabel: string
  multilineToastLabel: string
  singleItemToastMessage: string
}

/**
 * Shared menu labels and toast copy for each supported copy format.
 */
export const IMAGE_COPY_FORMATS: readonly ImageCopyFormatMeta[] = [
  {
    format: 'direct',
    menuLabel: 'Direct URL',
    copyActionLabel: 'Copy direct links',
    multilineToastLabel: 'direct links',
    singleItemToastMessage: 'Direct link copied',
  },
  {
    format: 'html',
    menuLabel: 'HTML <img>',
    copyActionLabel: 'Copy HTML <img>',
    multilineToastLabel: 'HTML <img>',
    singleItemToastMessage: 'HTML image tag copied',
  },
  {
    format: 'markdown',
    menuLabel: 'Markdown',
    copyActionLabel: 'Copy Markdown',
    multilineToastLabel: 'Markdown',
    singleItemToastMessage: 'Markdown copied',
  },
] as const

function toMarkdownAlt(name: string): string {
  return name.replaceAll('[', '\\[').replaceAll(']', '\\]')
}

function toHtmlAlt(name: string): string {
  return name
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

/**
 * Resolves copy metadata for one format.
 *
 * @param format Target copy format.
 * @returns Labels/messages used by menus and toasts.
 */
export function getImageCopyFormatMeta(format: ImageCopyFormat): ImageCopyFormatMeta {
  const meta = IMAGE_COPY_FORMATS.find(item => item.format === format)
  if (meta !== undefined) {
    return meta
  }
  return IMAGE_COPY_FORMATS[0]
}

/**
 * Builds newline-ready clipboard lines for one of the supported image copy formats.
 *
 * Rows without a public URL are skipped.
 *
 * @param images Source rows to format.
 * @param format Output copy format.
 * @returns Clipboard-ready lines for the requested format.
 */
export function buildImageCopyLines(
  images: readonly ImageCopyRow[],
  format: ImageCopyFormat,
): string[] {
  return images.flatMap((image) => {
    if (image.publicUrl === null) {
      return []
    }

    switch (format) {
      case 'direct':
        return [image.publicUrl]
      case 'html':
        return [`<img src="${image.publicUrl}" alt="${toHtmlAlt(image.name)}" />`]
      case 'markdown':
        return [`![${toMarkdownAlt(image.name)}](${image.publicUrl})`]
      default:
        return []
    }
  })
}
