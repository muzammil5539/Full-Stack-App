import { useEffect, useState } from 'react'
import { clearAuthToken, getAuthToken } from './token'

export function useAuthToken() {
  const [token, setToken] = useState<string | null>(() => getAuthToken())

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === 'auth_token') setToken(getAuthToken())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return {
    token,
    isAuthenticated: Boolean(token),
    refresh: () => setToken(getAuthToken()),
    logout: () => {
      clearAuthToken()
      setToken(null)
    },
  }
}
