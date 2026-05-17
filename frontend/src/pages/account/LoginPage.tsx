import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginWithToken } from '../../api/auth'
import { useAuth } from '../../contexts/AuthContext'
import ErrorMessage from '../../shared/ui/ErrorMessage'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string

const inputBase =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'

const linkBase = 'text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300'

export default function LoginPage() {
  const navigate = useNavigate()
  const googleButtonRef = useRef<HTMLDivElement>(null)
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Handle Google OAuth login
   */
  async function handleGoogleLogin(response: any) {
    try {
      setLoading(true)
      setError(null)

      const result = await fetch(`${API_BASE_URL}/api/v1/accounts/auth/google/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: response.credential }),
      })

      if (!result.ok) {
        const errorData = await result.json()
        throw new Error(errorData.error || 'Login failed')
      }

      const data = await result.json()

      if (data.key && data.user) {
        login(data.key, data.user)
        navigate('/account', { replace: true })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google login failed'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Initialize Google Sign-In on mount
   */
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.warn('VITE_GOOGLE_CLIENT_ID not configured')
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
            width: '100%',
          })
        }
      } else {
        setTimeout(initGoogle, 100)
      }
    }

    initGoogle()
  }, [])

  return (
    <div className="mx-auto grid w-full max-w-md gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Login</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Sign in to continue.
      </p>

      {error && <ErrorMessage message={error} />}

      {/* Google Sign-In Button */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
        <div ref={googleButtonRef} />
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-300 dark:border-slate-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-slate-500 dark:bg-slate-950 dark:text-slate-400">
            Or
          </span>
        </div>
      </div>

      {/* Email/Password Form */}
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          const form = new FormData(e.currentTarget)
          const email = String(form.get('email') ?? '')
          const password = String(form.get('password') ?? '')

          try {
            setLoading(true)
            setError(null)
            await loginWithToken(email, password)
            navigate('/account', { replace: true })
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Login failed'
            setError(message)
          } finally {
            setLoading(false)
          }
        }}
        className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
      >
        <label className="grid gap-1">
          <span className="text-sm font-medium">Email</span>
          <input name="email" type="email" required className={inputBase} />
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium">Password</span>
          <input name="password" type="password" required className={inputBase} />
        </label>

        <button type="submit" disabled={loading} className="h-10 bg-sky-600 text-white hover:bg-sky-700 dark:bg-sky-600 dark:hover:bg-sky-500 rounded-md">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="text-sm text-slate-600 dark:text-slate-300">
        No account?{' '}
        <Link to="/account/register" className={linkBase}>
          Register
        </Link>
      </div>
    </div>
  )
}
