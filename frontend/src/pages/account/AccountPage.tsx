import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyUser, listMyAddresses, type Address, type User } from '../../api/accounts'
import { useAuthToken } from '../../auth/useAuthToken'
import AuthRequired from '../../shared/ui/AuthRequired'
import ErrorMessage from '../../shared/ui/ErrorMessage'
import Loading from '../../shared/ui/Loading'

const buttonBase =
  'inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800'

const linkBase = 'text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300'

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
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <button onClick={logout} className={[buttonBase, 'h-9'].join(' ')}>
          Logout
        </button>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link to="/account/settings" className={linkBase}>
          Settings
        </Link>
        <Link to="/orders" className={linkBase}>
          Orders
        </Link>
        <Link to="/wishlist" className={linkBase}>
          Wishlist
        </Link>
        <Link to="/notifications" className={linkBase}>
          Notifications
        </Link>
      </div>

      {loading && <Loading label="Loading account…" />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && (
        <>
          <section className="grid gap-2 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
            <h2 className="text-lg font-semibold">Profile</h2>
            {user ? (
              <div className="grid gap-1 text-sm text-slate-700 dark:text-slate-200">
                <div>Email: {user.email}</div>
                <div>Username: {user.username}</div>
                <div>
                  Name: {user.first_name} {user.last_name}
                </div>
                <div>Verified: {String(user.is_verified)}</div>
              </div>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-300">No user returned yet.</p>
            )}
          </section>

          <section className="grid gap-2">
            <h2 className="text-lg font-semibold">Addresses</h2>
            {addresses.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">No addresses yet.</p>
            ) : (
              <div className="grid gap-3">
                {addresses.map((a) => (
                  <div
                    key={a.id}
                    className="grid gap-1 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950"
                  >
                    <strong>
                      {a.address_type} {a.is_default ? '(default)' : ''}
                    </strong>
                    <div className="text-sm text-slate-700 dark:text-slate-200">{a.full_name}</div>
                    <div className="text-sm text-slate-700 dark:text-slate-200">{a.phone}</div>
                    <div className="text-sm text-slate-700 dark:text-slate-200">
                      {a.address_line1} {a.address_line2}
                    </div>
                    <div className="text-sm text-slate-700 dark:text-slate-200">
                      {a.city}, {a.state} {a.postal_code}
                    </div>
                    <div className="text-sm text-slate-700 dark:text-slate-200">{a.country}</div>
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
