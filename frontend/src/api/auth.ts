import { clearAuthToken, setAuthToken } from '../auth/token'
import { postJson } from './http'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string

type TokenResponse = { token: string }

export async function loginWithToken(usernameOrEmail: string, password: string): Promise<string> {
  const data = await postJson<TokenResponse>(`${API_BASE_URL}/api/v1/accounts/token/`, {
    username: usernameOrEmail,
    password,
  })
  setAuthToken(data.token)
  return data.token
}

export function logout(): void {
  clearAuthToken()
}
