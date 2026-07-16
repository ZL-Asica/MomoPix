function copyBytes(source: Uint8Array): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(new ArrayBuffer(source.byteLength))
  copy.set(source)
  return copy
}

function scanForLargestJpeg(sourceBytes: Uint8Array): Uint8Array<ArrayBuffer> | null {
  let largest: Uint8Array | null = null
  let start = -1
  for (let index = 0; index + 1 < sourceBytes.byteLength; index += 1) {
    if (start === -1) {
      if (
        index + 2 < sourceBytes.byteLength
        && sourceBytes[index] === 0xFF
        && sourceBytes[index + 1] === 0xD8
        && sourceBytes[index + 2] === 0xFF
      ) {
        start = index
        index += 1
      }
      continue
    }

    if (sourceBytes[index] === 0xFF && sourceBytes[index + 1] === 0xD9) {
      const candidate = sourceBytes.subarray(start, index + 2)
      if (largest === null || candidate.byteLength > largest.byteLength) {
        largest = candidate
      }
      start = -1
      index += 1
    }
  }
  return largest === null ? null : copyBytes(largest)
}

/**
 * Extracts the largest JPEG preview embedded in a camera RAW file.
 *
 * TIFF-based sources use their preview IFD first. Other vendor containers fall
 * back to scanning for a complete camera-generated JPEG. Sensor data is never
 * developed in the browser, and sources without a preview are rejected.
 */
export async function extractRawPreview(sourceBytes: Uint8Array): Promise<Uint8Array<ArrayBuffer>> {
  try {
    const { Decoder } = await import('raw-decoder')
    return copyBytes(new Decoder(sourceBytes).extractJpeg())
  }
  catch {
    const scannedPreview = scanForLargestJpeg(sourceBytes)
    if (scannedPreview !== null) {
      return scannedPreview
    }
    throw new Error('No compatible embedded JPEG preview was found')
  }
}
