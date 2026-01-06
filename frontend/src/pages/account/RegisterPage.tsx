import { Link } from 'react-router-dom'

export default function RegisterPage() {
  return (
    <div style={{ display: 'grid', gap: 10, maxWidth: 420 }}>
      <h1 style={{ margin: 0 }}>Register</h1>
      <p style={{ margin: 0 }}>Starter page: connect to backend registration endpoint.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          alert('TODO: register flow')
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

        <button type="submit">Create account</button>
      </form>

      <div style={{ fontSize: 14 }}>
        Already have an account? <Link to="/account/login">Login</Link>
      </div>
    </div>
  )
}
