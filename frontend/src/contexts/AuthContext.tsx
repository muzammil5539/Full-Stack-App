import React, { createContext, useContext, useEffect, useState } from 'react'

interface User {
  id: number
  email: string
  username: string
  first_name: string
  last_name: string
  phone: string
  avatar: string | null
  is_verified: boolean
  is_staff: boolean
  is_superuser: boolean
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (token: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * AuthProvider component that manages authentication state.
 * 
 * Stores auth token and user data in localStorage for persistence.
 * Provides login/logout functions and authentication state to child components.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  /**
   * Initialize auth state from localStorage on component mount.
   */
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Failed to restore auth state:', error)
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
      }
    }

    setIsLoading(false)
  }, [])

  /**
   * Store auth token and user data in localStorage.
   */
  function login(authToken: string, userData: User) {
    localStorage.setItem('auth_token', authToken)
    localStorage.setItem('user', JSON.stringify(userData))
    setToken(authToken)
    setUser(userData)
  }

  /**
   * Clear auth data from state and localStorage.
   */
  function logout() {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to use authentication context.
 * 
 * Must be used within an AuthProvider component.
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
