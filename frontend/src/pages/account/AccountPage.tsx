import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyUser, listMyAddresses, type Address, type User } from '../../api/accounts'
import { useAuthToken } from '../../auth/useAuthToken'
import AuthRequired from '../../shared/ui/AuthRequired'
import ErrorMessage from '../../shared/ui/ErrorMessage'
import Loading from '../../shared/ui/Loading'

export default function AccountPage() {
  const { isAuthenticated, logout } = useAuthToken()
  const [user, setUser] = useState<User | null>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) return

    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const [me, addrs] = await Promise.all([getMyUser(), listMyAddresses()])
        if (!cancelled) {
          setUser(me)
          setAddresses(addrs)
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to load account'
        if (!cancelled) setError(message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  if (!isAuthenticated) return <AuthRequired />

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <h1 style={{ margin: 0 }}>Account</h1>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          onClick={() => {
            logout()
          }}
        >
          Logout
        </button>
        <Link to="/orders">Orders</Link>
        <Link to="/wishlist">Wishlist</Link>
      </div>

      {loading && <Loading label="Loading account…" />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && (
        <>
          <section style={{ display: 'grid', gap: 6 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>Profile</h2>
            {user ? (
              <div style={{ display: 'grid', gap: 4 }}>
                <div>Email: {user.email}</div>
                <div>Username: {user.username}</div>
                <div>
                  Name: {user.first_name} {user.last_name}
                </div>
                <div>Verified: {String(user.is_verified)}</div>
              </div>
            ) : (
              <p style={{ margin: 0 }}>No user returned yet.</p>
            )}
          </section>

          <section style={{ display: 'grid', gap: 6 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>Addresses</h2>
            {addresses.length === 0 ? (
              <p style={{ margin: 0 }}>No addresses yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {addresses.map((a) => (
                  <div
                    key={a.id}
                    style={{
                      border: '1px solid rgba(127,127,127,0.35)',
                      borderRadius: 8,
                      padding: 12,
                      display: 'grid',
                      gap: 4,
                    }}
                  >
                    <strong>
                      {a.address_type} {a.is_default ? '(default)' : ''}
                    </strong>
                    <div>{a.full_name}</div>
                    <div>{a.phone}</div>
                    <div>
                      {a.address_line1} {a.address_line2}
                    </div>
                    <div>
                      {a.city}, {a.state} {a.postal_code}
                    </div>
                    <div>{a.country}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
