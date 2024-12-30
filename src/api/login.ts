import { fetchAPI } from '@/utils'

interface LoginRequest {
  username: string
  password: string
}

async function login(body: LoginRequest): Promise<UserData> {
  const response = await fetchAPI<UserData>('/api/login', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return response.data
}

export default login
