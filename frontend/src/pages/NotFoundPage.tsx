import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <h1 style={{ margin: 0 }}>404</h1>
      <p style={{ margin: 0 }}>Page not found.</p>
      <div>
        <Link to="/">Go home</Link>
      </div>
    </div>
  )
}
