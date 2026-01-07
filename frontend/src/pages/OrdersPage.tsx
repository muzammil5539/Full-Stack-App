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
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <Link
          to="/checkout"
          className="inline-flex h-9 items-center rounded-md bg-sky-600 px-3 text-sm font-medium text-white hover:bg-sky-700"
        >
          Create from cart
        </Link>
      </div>

      {loading && <Loading label="Loading orders…" />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && (
        <div className="grid gap-3">
          {orders.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">No orders yet.</p>
          ) : (
            orders.map((o) => (
              <div
                key={o.id}
                className="grid gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="flex items-start justify-between gap-3">
                  <Link
                    to={`/orders/${o.id}`}
                    className="text-sm font-semibold text-sky-700 hover:underline dark:text-sky-300"
                  >
                    {o.order_number}
                  </Link>
                  <span className="text-sm font-semibold">{o.total}</span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Status: {o.status}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
