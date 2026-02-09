export type ImageCopyFormat = 'direct' | 'html' | 'markdown'
export interface ImageCopyRow {
  name: string
  publicUrl: string | null
}

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
 * Builds newline-ready clipboard lines for one of the supported image copy formats.
 *
 * Rows without a public URL are skipped.
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
