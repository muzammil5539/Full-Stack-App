import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginWithToken } from '../../api/auth'
import ErrorMessage from '../../shared/ui/ErrorMessage'

const inputBase =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'

const linkBase = 'text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300'

export default function LoginPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="mx-auto grid w-full max-w-md gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Login</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Sign in to continue.
      </p>

      {error && <ErrorMessage message={error} />}

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

        <button type="submit" disabled={loading} className="h-10 bg-sky-600 text-white hover:bg-sky-700 dark:bg-sky-600 dark:hover:bg-sky-500">
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
