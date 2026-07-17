/** Builds a safe attachment header for a user-supplied source filename. */
export function buildAttachmentDisposition(filename: string): string {
  const safeUnicode = filename.replaceAll(/[\r\n]/g, '').trim() || 'original-image'
  const asciiFallback = safeUnicode
    .replaceAll(/[^\x20-\x7E]/g, '_')
    .replaceAll(/["\\]/g, '_')
  const encodedUnicode = encodeURIComponent(safeUnicode)
    .replaceAll(/[!'()*]/g, character => `%${character.charCodeAt(0).toString(16).toUpperCase()}`)
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodedUnicode}`
}
