import { fetchAPI } from '@/utils'

interface RegisterRequest {
  username: string
  password: string
}

async function register(body: RegisterRequest): Promise<UserData> {
  const response = await fetchAPI<UserData>('/api/register', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return response.data
}

export default register
