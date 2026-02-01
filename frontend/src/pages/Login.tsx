import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string

/**
 * Login page component with Google OAuth 2.0 authentication.
 * 
 * Provides Google Sign-In button that authenticates users with their
 * real Gmail accounts. Verifies that email exists and belongs to the user.
 */
export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const googleButtonRef = useRef<HTMLDivElement>(null)
  const { login } = useAuth()

  /**
   * Handle successful Google login.
   * 
   * Sends the ID token to backend for verification and user creation.
   * Stores auth token in localStorage and redirects to dashboard.
   */
  async function handleGoogleLogin(response: any) {
    try {
      const result = await fetch(`${API_BASE_URL}/api/v1/accounts/auth/google/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: response.credential }),
      })

      if (!result.ok) {
        const errorData = await result.json()
        console.error('Login failed:', errorData)
        alert('Login failed. Please try again.')
        return
      }

      const data = await result.json()

      if (data.key && data.user) {
        // Store auth token and user data
        login(data.key, data.user)

        // Redirect to original page or dashboard
        const redirectPath = location.state?.from?.pathname || '/dashboard'
        navigate(redirectPath)
      }
    } catch (error) {
      console.error('Login error:', error)
      alert('An error occurred during login. Please try again.')
    }
  }

  /**
   * Initialize Google Sign-In button on component mount.
   */
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.error('VITE_GOOGLE_CLIENT_ID not configured')
      return
    }

    const initGoogle = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleLogin,
        })

        if (googleButtonRef.current) {
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            theme: 'outline',
            size: 'large',
            width: '300',
          })
        }
      } else {
        // Retry if Google API not loaded yet
        setTimeout(initGoogle, 100)
      }
    }

    initGoogle()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg dark:bg-slate-800">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Welcome Back
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Sign in with your Google account
          </p>
        </div>

        {/* Google Sign-In Button */}
        <div className="flex justify-center mb-6">
          <div ref={googleButtonRef} />
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-300 dark:border-slate-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              Or
            </span>
          </div>
        </div>

        {/* Traditional Login Link */}
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400">
            Don't have a Google account?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
            >
              Create one
            </button>
          </p>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            ✓ Sign in with your real Gmail account
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            ✓ Fast and secure authentication
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            ✓ Your email is verified by Google
          </p>
        </div>
      </div>
    </div>
  )
}
