import { fetchAPI } from '@/utils';
import type { DeleteRequest } from '@/schemas';
import { DeleteRequestSchema } from '@/schemas';

const deleteFiles = async (body: DeleteRequest): Promise<UserData> => {
  // Validate the request body against the schema
  const parsedBody = DeleteRequestSchema.parse(body);

  // Make API call
  const response = await fetchAPI<UserData>('/api/file', {
    method: 'DELETE',
    body: JSON.stringify(parsedBody),
  });

  return response.data;
};

export default deleteFiles;
