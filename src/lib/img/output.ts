/**
 * Determines whether a transformed image should replace its source file.
 *
 * A same-sized output offers no storage benefit and can introduce an
 * unnecessary lossy conversion, so the source remains the final file.
 *
 * @param input Source and transformed byte sizes.
 * @param input.originalSize Source file size in bytes.
 * @param input.outputSize Transformed file size in bytes.
 * @returns `true` when the source file should be kept.
 */
export function shouldKeepOriginalImage(input: {
  originalSize: number
  outputSize: number
}): boolean {
  return input.outputSize >= input.originalSize
}
