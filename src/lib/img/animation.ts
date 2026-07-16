function readU32BE(bytes: Uint8Array, offset: number): number | null {
  if (offset < 0 || offset + 4 > bytes.length) {
    return null
  }
  return ((bytes[offset] * 2 ** 24) + (bytes[offset + 1] << 16) + (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0
}

function hasAscii(bytes: Uint8Array, offset: number, value: string): boolean {
  return offset >= 0
    && offset + value.length <= bytes.length
    && [...value].every((character, index) => bytes[offset + index] === character.charCodeAt(0))
}

function skipGifSubBlocks(bytes: Uint8Array, start: number): number | null {
  let offset = start
  while (offset < bytes.length) {
    const size = bytes[offset]
    offset += 1
    if (size === 0) {
      return offset
    }
    if (offset + size > bytes.length) {
      return null
    }
    offset += size
  }
  return null
}

function isAnimatedGif(bytes: Uint8Array): boolean {
  if (!hasAscii(bytes, 0, 'GIF87a') && !hasAscii(bytes, 0, 'GIF89a')) {
    return false
  }

  let offset = 13
  const packedFields = bytes[10]
  if (packedFields === undefined) {
    return false
  }
  if ((packedFields & 0x80) !== 0) {
    offset += 3 * (2 ** ((packedFields & 0x07) + 1))
  }

  let frameCount = 0
  while (offset < bytes.length) {
    const blockType = bytes[offset]
    offset += 1

    if (blockType === 0x3B) {
      return false
    }

    if (blockType === 0x21) {
      // Extension label followed by GIF data sub-blocks.
      offset += 1
      const nextOffset = skipGifSubBlocks(bytes, offset)
      if (nextOffset === null) {
        return false
      }
      offset = nextOffset
      continue
    }

    if (blockType !== 0x2C || offset + 9 > bytes.length) {
      return false
    }

    const imagePackedFields = bytes[offset + 8]
    offset += 9
    if ((imagePackedFields & 0x80) !== 0) {
      offset += 3 * (2 ** ((imagePackedFields & 0x07) + 1))
    }
    // LZW minimum code size precedes the image's data sub-blocks.
    offset += 1
    const nextOffset = skipGifSubBlocks(bytes, offset)
    if (nextOffset === null) {
      return false
    }
    offset = nextOffset
    frameCount += 1
    if (frameCount > 1) {
      return true
    }
  }

  return false
}

function isAnimatedPng(bytes: Uint8Array): boolean {
  if (!hasAscii(bytes, 1, 'PNG')) {
    return false
  }

  let offset = 8
  while (offset + 12 <= bytes.length) {
    const length = readU32BE(bytes, offset)
    if (length === null || offset + 12 + length > bytes.length) {
      return false
    }
    if (hasAscii(bytes, offset + 4, 'acTL')) {
      return true
    }
    offset += 12 + length
  }

  return false
}

/**
 * Detects supported animated raster formats before the canvas path decodes a
 * single frame and would silently flatten the animation.
 */
export function isAnimatedRaster(bytes: Uint8Array): boolean {
  return isAnimatedGif(bytes) || isAnimatedPng(bytes)
}
