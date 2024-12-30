import type { DeleteRequest } from '@/schemas'
import { DeleteRequestSchema } from '@/schemas'
import { fetchAPI } from '@/utils'

async function deleteFiles(body: DeleteRequest): Promise<UserData> {
  // Validate the request body against the schema
  const parsedBody = DeleteRequestSchema.parse(body)

  // Make API call
  const response = await fetchAPI<UserData>('/api/file', {
    method: 'DELETE',
    body: JSON.stringify(parsedBody),
  })

  return response.data
}

export default deleteFiles
