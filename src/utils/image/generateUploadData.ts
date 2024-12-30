import type { UploadFile } from '@/schemas'

import { generateUniqueId } from '@zl-asica/react'

import processImage from './processImage'

async function generateUploadData(uid: string, files: File[]): Promise<UploadFile[]> {
  const uploadData: UploadFile[] = await Promise.all(
    files.map(async (singleFile) => {
      const id = await generateUniqueId([
        uid,
        singleFile.name,
        singleFile.size.toString(),
      ])

      const date = new Date().toISOString().split('T')[0].replace(/-/g, '/')

      const url = `${date}/${id}`

      const processedFile = await processImage(singleFile)
      if (!processedFile) {
        throw new Error(`处理图片失败：${singleFile.name}`)
      }

      const fileExtension = processedFile.type.split('/')[1] || 'bin'
      const key = `${url}.${fileExtension}`

      return {
        key, // Backend key
        name: singleFile.name.includes('.')
          ? singleFile.name.replace(/\.[^./]+$/, '')
          : singleFile.name,
        file: processedFile, // Processed Blob
      }
    }),
  )

  return uploadData
}

export default generateUploadData
