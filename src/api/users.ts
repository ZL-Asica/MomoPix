import { fetchAPI } from '@/utils'

async function usersPut(body: Partial<UserData>): Promise<UserData> {
  const response = await fetchAPI<UserData>('/api/users', {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  return response.data
}

export { usersPut }
