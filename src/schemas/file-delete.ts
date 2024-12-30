import { z } from 'zod'

const DeleteRequestSchema = z.object({
  albumName: z.string(),
  urls: z.array(z.string().url()), // 完整 URL
})

type DeleteRequest = z.infer<typeof DeleteRequestSchema>

export { DeleteRequestSchema }
export type { DeleteRequest }
