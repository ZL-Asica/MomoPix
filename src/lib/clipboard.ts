/**
 * Writes plain text to the system clipboard.
 *
 * @param value Plain text to copy.
 * @returns Resolves after clipboard write succeeds.
 * @throws Error when Clipboard API is unavailable.
 */
export async function copyTextToClipboard(value: string): Promise<void> {
  if (typeof navigator === 'undefined' || navigator.clipboard?.writeText === undefined) {
    throw new Error('Clipboard API is unavailable in this browser context')
  }
  await navigator.clipboard.writeText(value)
}

/**
 * Writes a list of lines to clipboard joined by single newlines.
 *
 * @param lines Text lines to join and copy.
 * @returns Resolves after clipboard write succeeds.
 */
export async function copyLinesToClipboard(lines: readonly string[]): Promise<void> {
  await copyTextToClipboard(lines.join('\n'))
}
