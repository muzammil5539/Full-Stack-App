import { Link } from 'react-router-dom'

export default function AuthRequired({ message }: { message?: string }) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <p style={{ margin: 0 }}>{message ?? 'You must be logged in to view this page.'}</p>
      <div>
        <Link to="/account/login">Go to login →</Link>
      </div>
    </div>
  )
}
