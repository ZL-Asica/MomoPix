import { fetchAPI } from '@/utils';

const usersPut = async (body: Partial<UserData>): Promise<UserData> => {
  const response = await fetchAPI<UserData>('/api/users', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return response.data;
};

export { usersPut };
