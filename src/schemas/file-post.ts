import { z } from 'zod'

const UploadFileSchema = z.object({
  key: z.string(),
  name: z.string(),
  file: z.instanceof(Blob),
})

const UploadRequestSchema = z.object({
  albumName: z.string(),
  files: z.array(UploadFileSchema),
})

type UploadFile = z.infer<typeof UploadFileSchema>
type UploadRequest = z.infer<typeof UploadRequestSchema>

export { UploadFileSchema, UploadRequestSchema }
export type { UploadFile, UploadRequest }
