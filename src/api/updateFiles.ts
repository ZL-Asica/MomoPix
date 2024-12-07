import { fetchAPI } from '@/utils';
import type { UpdateRequest } from '@/schemas';
import { UpdateRequestSchema } from '@/schemas';

const updateFiles = async (body: UpdateRequest): Promise<UserData> => {
  // Validate the request body against the schema
  const parsedBody = UpdateRequestSchema.parse(body);

  // Make API call
  const response = await fetchAPI<UserData>('/api/file', {
    method: 'PUT',
    body: JSON.stringify(parsedBody),
  });

  return response.data;
};

export default updateFiles;
