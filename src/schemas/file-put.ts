import { z } from 'zod'

const UpdateRequestSchema = z.object({
  albumName: z.string(),
  updates: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    }),
  ),
})

type UpdateRequest = z.infer<typeof UpdateRequestSchema>

export { UpdateRequestSchema }
export type { UpdateRequest }
