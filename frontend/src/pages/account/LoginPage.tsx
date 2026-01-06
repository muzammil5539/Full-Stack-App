import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginWithToken } from '../../api/auth'
import ErrorMessage from '../../shared/ui/ErrorMessage'

export default function LoginPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div style={{ display: 'grid', gap: 10, maxWidth: 420 }}>
      <h1 style={{ margin: 0 }}>Login</h1>
      <p style={{ margin: 0 }}>
        Starter page: connect to backend auth endpoint (JWT/session) and store tokens.
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
        style={{ display: 'grid', gap: 10 }}
      >
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Email</span>
          <input name="email" type="email" required />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Password</span>
          <input name="password" type="password" required />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div style={{ fontSize: 14 }}>
        No account? <Link to="/account/register">Register</Link>
      </div>
    </div>
  )
}
