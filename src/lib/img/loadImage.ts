'use client'

import { decode as decodeAVIF } from '@jsquash/avif'
import { decode as decodeJPEG } from '@jsquash/jpeg'
import { decode as decodeWebP } from '@jsquash/webp'
import { checkImageFormat } from './checker'

export const loadImageFromSrc = async (
  src: string,
): Promise<ImageData> => {
  const img = document.createElement('img')
  img.src = src
  await new Promise(resolve => img.onload = resolve)
  const canvas = document.createElement('canvas');
  [canvas.width, canvas.height] = [img.width, img.height]
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }
  ctx.drawImage(img, 0, 0)
  return ctx.getImageData(0, 0, img.width, img.height)
}

export const loadImageFromFile = async (
  file: File,
): Promise<ImageData | null> => {
  const format = checkImageFormat(file)
  switch (format) {
    case 'avif':
      return decodeAVIF(await file.arrayBuffer())
    case 'webp':
      return decodeWebP(await file.arrayBuffer())
    case 'jpeg':
      return decodeJPEG(await file.arrayBuffer())
    default:
      return loadImageFromSrc(URL.createObjectURL(file))
  }
}
