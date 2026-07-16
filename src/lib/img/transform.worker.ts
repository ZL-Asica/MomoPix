/// <reference lib="webworker" />

import type { TransformImageResult } from './transform-client'
import { parseUploadImage } from '@/lib/images/uploadValidation'
import { isAnimatedRaster } from './animation'
import { MAX_TRANSFORM_PIXELS, OUTPUT_MIME_TYPE_BY_FORMAT, THUMBNAIL_MAX_EDGE } from './constants'
import { encodeImage } from './encoders'
import { extractRawPreview } from './rawPreview'

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

const NATIVE_METADATA_PROBE_BYTES = 2 * 1024 * 1024

interface FullTransformRequest {
  id: number
  mode: 'full'
  file: File
  format: SupportedFormat
  quality?: number
}

interface ThumbnailTransformRequest {
  id: number
  mode: 'thumbnail'
  file: File
}

type TransformRequest = FullTransformRequest | ThumbnailTransformRequest

interface DecodedSource {
  canvas: OffscreenCanvas
  width: number
  height: number
  sourceWidth: number
  sourceHeight: number
  sourceNotice: string | null
  preservedOriginal: boolean
}

function extensionOf(name: string): string {
  return name.split('.').pop()?.trim().toLowerCase() ?? ''
}

function assertPixelBudget(width: number, height: number): void {
  if (width < 1 || height < 1 || width * height > MAX_TRANSFORM_PIXELS) {
    throw new Error(`Image dimensions exceed the ${MAX_TRANSFORM_PIXELS / 1_000_000} megapixel transform limit`)
  }
}

function canvasFromImageData(imageData: ImageData): OffscreenCanvas {
  const canvas = new OffscreenCanvas(imageData.width, imageData.height)
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Failed to initialize image worker canvas')
  }
  context.putImageData(imageData, 0, 0)
  return canvas
}

async function decodeHeif(file: File): Promise<DecodedSource> {
  const module = await import('libheif-js/wasm-bundle')
  const libheif = (module.default ?? module) as unknown as {
    HeifDecoder: new () => {
      decode: (bytes: Uint8Array) => Array<{
        get_width: () => number
        get_height: () => number
        display: (target: ImageData, callback: (result: ImageData | null) => void) => void
      }>
    }
  }
  const decoder = new libheif.HeifDecoder()
  const [image] = decoder.decode(new Uint8Array(await file.arrayBuffer()))
  if (image === undefined) {
    throw new Error('Unable to decode HEIC/HEIF image')
  }

  const width = image.get_width()
  const height = image.get_height()
  assertPixelBudget(width, height)
  const imageData = new ImageData(width, height)
  await new Promise<void>((resolve, reject) => {
    image.display(imageData, (result) => {
      if (result === null) {
        reject(new Error('Unable to render HEIC/HEIF image'))
        return
      }
      resolve()
    })
  })

  return {
    canvas: canvasFromImageData(imageData),
    width,
    height,
    sourceWidth: width,
    sourceHeight: height,
    sourceNotice: null,
    preservedOriginal: false,
  }
}

async function decodeTiff(file: File): Promise<DecodedSource> {
  const UTIF = await import('utif2')
  const buffer = await file.arrayBuffer()
  const [ifd] = UTIF.decode(buffer)
  if (ifd === undefined) {
    throw new Error('Unable to read TIFF image')
  }

  const taggedWidth = Array.isArray(ifd.t256) ? Number(ifd.t256[0]) : 0
  const taggedHeight = Array.isArray(ifd.t257) ? Number(ifd.t257[0]) : 0
  if (taggedWidth > 0 && taggedHeight > 0) {
    assertPixelBudget(taggedWidth, taggedHeight)
  }

  UTIF.decodeImage(buffer, ifd)
  assertPixelBudget(ifd.width, ifd.height)
  const rgba = UTIF.toRGBA8(ifd)
  const pixels = new Uint8ClampedArray(rgba.byteLength)
  pixels.set(rgba)
  const imageData = new ImageData(pixels, ifd.width, ifd.height)

  return {
    canvas: canvasFromImageData(imageData),
    width: ifd.width,
    height: ifd.height,
    sourceWidth: ifd.width,
    sourceHeight: ifd.height,
    sourceNotice: null,
    preservedOriginal: false,
  }
}

async function decodeRaw(file: File): Promise<DecodedSource> {
  const sourceBytes = new Uint8Array(await file.arrayBuffer())
  try {
    const previewBytes = await extractRawPreview(sourceBytes)
    const bitmap = await createImageBitmap(new Blob([previewBytes.buffer], { type: 'image/jpeg' }))
    try {
      assertPixelBudget(bitmap.width, bitmap.height)
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
      const context = canvas.getContext('2d')
      if (!context) {
        throw new Error('Failed to initialize RAW preview canvas')
      }
      context.drawImage(bitmap, 0, 0)
      return {
        canvas,
        width: bitmap.width,
        height: bitmap.height,
        sourceWidth: bitmap.width,
        sourceHeight: bitmap.height,
        sourceNotice: 'Hosted image was generated from the RAW embedded JPEG preview.',
        preservedOriginal: false,
      }
    }
    finally {
      bitmap.close()
    }
  }
  catch (error) {
    throw new Error(`Unable to extract a compatible RAW preview: ${error instanceof Error ? error.message : String(error)}`)
  }
}

async function decodeNative(file: File, bytes: Uint8Array): Promise<DecodedSource> {
  const metadata = parseUploadImage(bytes)
  if (!metadata) {
    throw new Error('Unable to read image dimensions')
  }
  assertPixelBudget(metadata.width, metadata.height)
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    assertPixelBudget(bitmap.width, bitmap.height)
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Failed to initialize image worker canvas')
    }
    context.drawImage(bitmap, 0, 0)
    return {
      canvas,
      width: bitmap.width,
      height: bitmap.height,
      sourceWidth: metadata.width,
      sourceHeight: metadata.height,
      sourceNotice: null,
      preservedOriginal: isAnimatedRaster(bytes),
    }
  }
  finally {
    bitmap.close()
  }
}

async function decodeSource(file: File): Promise<DecodedSource> {
  const extension = extensionOf(file.name)
  if (extension === 'heic' || extension === 'heif') {
    return decodeHeif(file)
  }
  if (extension === 'tif' || extension === 'tiff') {
    return decodeTiff(file)
  }
  if (RAW_EXTENSIONS.has(extension)) {
    return decodeRaw(file)
  }
  const bytes = new Uint8Array(await file.arrayBuffer())
  return decodeNative(file, bytes)
}

function outputDimensions(width: number, height: number, maxEdge: number): { width: number, height: number } {
  const scale = Math.min(1, maxEdge / Math.max(width, height))
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

function requiresDedicatedDecoder(file: File): boolean {
  const extension = extensionOf(file.name)
  return extension === 'heic'
    || extension === 'heif'
    || extension === 'tif'
    || extension === 'tiff'
    || RAW_EXTENSIONS.has(extension)
}

async function encodeCanvas(
  canvas: OffscreenCanvas,
  format: SupportedFormat,
  quality?: number,
): Promise<Blob> {
  const mimeType = OUTPUT_MIME_TYPE_BY_FORMAT[format]
  const qualityValue = quality === undefined ? undefined : Math.min(1, Math.max(0.1, quality / 100))
  const nativeBlob = await canvas
    .convertToBlob({ type: mimeType, quality: qualityValue })
    .catch(() => null)
  if (nativeBlob !== null && nativeBlob.type === mimeType) {
    return nativeBlob
  }

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Failed to read image worker canvas')
  }
  const encoded = await encodeImage(
    context.getImageData(0, 0, canvas.width, canvas.height),
    format,
    quality,
  )
  const bytes = encoded instanceof Uint8Array
    ? encoded.slice().buffer
    : encoded
  return new Blob([bytes], { type: mimeType })
}

async function transformThumbnailOnly(file: File): Promise<{
  mode: 'thumbnail'
  blob: Blob
  width: number
  height: number
}> {
  if (requiresDedicatedDecoder(file)) {
    const decoded = await decodeSource(file)
    const dimensions = outputDimensions(decoded.width, decoded.height, THUMBNAIL_MAX_EDGE)
    const canvas = new OffscreenCanvas(dimensions.width, dimensions.height)
    try {
      const context = canvas.getContext('2d')
      if (!context) {
        throw new Error('Failed to initialize thumbnail canvas')
      }
      context.drawImage(decoded.canvas, 0, 0, dimensions.width, dimensions.height)
      return {
        mode: 'thumbnail',
        blob: await encodeCanvas(canvas, 'webp', 72),
        width: dimensions.width,
        height: dimensions.height,
      }
    }
    finally {
      decoded.canvas.width = 1
      decoded.canvas.height = 1
      canvas.width = 1
      canvas.height = 1
    }
  }

  const probe = new Uint8Array(await file.slice(0, NATIVE_METADATA_PROBE_BYTES).arrayBuffer())
  const metadata = parseUploadImage(probe)
  if (metadata === null) {
    throw new Error('Unable to read image dimensions for thumbnail generation')
  }
  const dimensions = outputDimensions(metadata.width, metadata.height, THUMBNAIL_MAX_EDGE)
  const bitmap = await createImageBitmap(file, {
    imageOrientation: 'from-image',
    resizeWidth: dimensions.width,
    resizeHeight: dimensions.height,
    resizeQuality: 'high',
  })
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
  try {
    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('Failed to initialize thumbnail canvas')
    }
    context.drawImage(bitmap, 0, 0)
    return {
      mode: 'thumbnail',
      blob: await encodeCanvas(canvas, 'webp', 72),
      width: bitmap.width,
      height: bitmap.height,
    }
  }
  finally {
    bitmap.close()
    canvas.width = 1
    canvas.height = 1
  }
}

async function transform(request: TransformRequest): Promise<
  | (Omit<TransformImageResult, 'blob'> & { mode: 'full', blob: Blob | null })
  | { mode: 'thumbnail', blob: Blob, width: number, height: number }
> {
  if (request.mode === 'thumbnail') {
    return transformThumbnailOnly(request.file)
  }

  const decoded = await decodeSource(request.file)
  const thumbnailDimensions = outputDimensions(decoded.width, decoded.height, THUMBNAIL_MAX_EDGE)
  const thumbnailCanvas = new OffscreenCanvas(thumbnailDimensions.width, thumbnailDimensions.height)
  try {
    const thumbnailContext = thumbnailCanvas.getContext('2d')
    if (!thumbnailContext) {
      throw new Error('Failed to initialize thumbnail canvas')
    }
    thumbnailContext.drawImage(decoded.canvas, 0, 0, thumbnailDimensions.width, thumbnailDimensions.height)
    const thumbnailBlob = await encodeCanvas(thumbnailCanvas, 'webp', 72)

    const hostedBlob = decoded.preservedOriginal
      ? null
      : await encodeCanvas(decoded.canvas, request.format, request.quality)

    return {
      mode: 'full',
      blob: hostedBlob,
      mimeType: decoded.preservedOriginal
        ? request.file.type
        : OUTPUT_MIME_TYPE_BY_FORMAT[request.format],
      width: decoded.width,
      height: decoded.height,
      sourceWidth: decoded.sourceWidth,
      sourceHeight: decoded.sourceHeight,
      thumbnailBlob,
      thumbnailWidth: thumbnailDimensions.width,
      thumbnailHeight: thumbnailDimensions.height,
      preservedOriginal: decoded.preservedOriginal,
      sourceNotice: decoded.sourceNotice,
    }
  }
  finally {
    // Resetting dimensions releases browser/GPU backing stores immediately.
    decoded.canvas.width = 1
    decoded.canvas.height = 1
    thumbnailCanvas.width = 1
    thumbnailCanvas.height = 1
  }
}

const workerScope = globalThis as unknown as DedicatedWorkerGlobalScope
let transformQueue = Promise.resolve()

workerScope.addEventListener('message', (event: MessageEvent<TransformRequest>) => {
  const request = event.data
  transformQueue = transformQueue.then(async () => {
    try {
      const result = await transform(request)
      workerScope.postMessage({ id: request.id, result })
    }
    catch (error) {
      workerScope.postMessage({
        id: request.id,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  })
})

export {}
