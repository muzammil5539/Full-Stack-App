import { useEffect, useState } from 'react'
import { listNotifications, markAllNotificationsRead, type Notification } from '../api/notifications'
import { useAuthToken } from '../auth/useAuthToken'
import AuthRequired from '../shared/ui/AuthRequired'
import ErrorMessage from '../shared/ui/ErrorMessage'
import Loading from '../shared/ui/Loading'

const buttonBase =
  'inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800'

export default function NotificationsPage() {
  const { isAuthenticated } = useAuthToken()
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    try {
      setLoading(true)
      setError(null)
      const data = await listNotifications()
      setItems(data)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load notifications'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return
    void refresh()
  }, [isAuthenticated])

  if (!isAuthenticated) return <AuthRequired />

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        <button
          onClick={async () => {
            await markAllNotificationsRead()
            await refresh()
          }}
          className={[buttonBase, 'h-9'].join(' ')}
        >
          Mark all as read
        </button>
      </div>

      {loading && <Loading label="Loading notifications…" />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && (
        <div className="grid gap-3">
          {items.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">No notifications.</p>
          ) : (
            items.map((n) => (
              <div
                key={n.id}
                className="grid gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="flex items-start justify-between gap-3">
                  <strong className="text-sm font-semibold">{n.title}</strong>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {n.is_read ? 'Read' : 'Unread'}
                  </span>
                </div>
                <div className="text-sm text-slate-700 dark:text-slate-200">{n.message}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
