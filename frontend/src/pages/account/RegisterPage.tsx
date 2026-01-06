import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerWithToken } from '../../api/auth'
import ErrorMessage from '../../shared/ui/ErrorMessage'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="mx-auto grid w-full max-w-md gap-4">
      <h1>Register</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">Create a new account.</p>

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
            await registerWithToken(email, password)
            navigate('/account', { replace: true })
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Registration failed'
            setError(message)
          } finally {
            setLoading(false)
          }
        }}
        className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
      >
        <label className="grid gap-1">
          <span className="text-sm font-medium">Email</span>
          <input name="email" type="email" required />
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium">Password</span>
          <input name="password" type="password" required />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="h-10 bg-sky-600 text-white hover:bg-sky-700 dark:bg-sky-600 dark:hover:bg-sky-500"
        >
          {loading ? 'Creating…' : 'Create account'}
        </button>
      </form>

      <div className="text-sm text-slate-600 dark:text-slate-300">
        Already have an account? <Link to="/account/login">Login</Link>
      </div>
    </div>
  )
}
