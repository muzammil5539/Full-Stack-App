import { useEffect, useState } from 'react'
import { listNotifications, markAllNotificationsRead, type Notification } from '../api/notifications'
import { useAuthToken } from '../auth/useAuthToken'
import AuthRequired from '../shared/ui/AuthRequired'
import ErrorMessage from '../shared/ui/ErrorMessage'
import Loading from '../shared/ui/Loading'

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
    <div style={{ display: 'grid', gap: 12 }}>
      <h1 style={{ margin: 0 }}>Notifications</h1>

      <div>
        <button
          onClick={async () => {
            await markAllNotificationsRead()
            await refresh()
          }}
        >
          Mark all as read
        </button>
      </div>

      {loading && <Loading label="Loading notifications…" />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && (
        <div style={{ display: 'grid', gap: 10 }}>
          {items.length === 0 ? (
            <p style={{ margin: 0 }}>No notifications.</p>
          ) : (
            items.map((n) => (
              <div
                key={n.id}
                style={{
                  border: '1px solid rgba(127,127,127,0.35)',
                  borderRadius: 8,
                  padding: 12,
                  display: 'grid',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <strong>{n.title}</strong>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>{n.is_read ? 'Read' : 'Unread'}</span>
                </div>
                <div style={{ opacity: 0.9 }}>{n.message}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
