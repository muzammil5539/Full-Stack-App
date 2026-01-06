import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listOrders, type Order } from '../api/orders'
import { useAuthToken } from '../auth/useAuthToken'
import AuthRequired from '../shared/ui/AuthRequired'
import ErrorMessage from '../shared/ui/ErrorMessage'
import Loading from '../shared/ui/Loading'

export default function OrdersPage() {
  const { isAuthenticated } = useAuthToken()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) return

    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const data = await listOrders()
        if (!cancelled) setOrders(data)
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to load orders'
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
      <h1 style={{ margin: 0 }}>Orders</h1>
      <div>
        <Link to="/checkout">Create order from cart →</Link>
      </div>

      {loading && <Loading label="Loading orders…" />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && (
        <div style={{ display: 'grid', gap: 10 }}>
          {orders.length === 0 ? (
            <p style={{ margin: 0 }}>No orders yet.</p>
          ) : (
            orders.map((o) => (
              <div
                key={o.id}
                style={{
                  border: '1px solid rgba(127,127,127,0.35)',
                  borderRadius: 8,
                  padding: 12,
                  display: 'grid',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <strong>{o.order_number}</strong>
                  <span>{o.total}</span>
                </div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>Status: {o.status}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
