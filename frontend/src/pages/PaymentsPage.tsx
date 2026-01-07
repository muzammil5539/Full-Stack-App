import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listOrders, type Order } from '../api/orders'
import { listPayments, type Payment } from '../api/payments'
import { useAuthToken } from '../auth/useAuthToken'
import AuthRequired from '../shared/ui/AuthRequired'
import ErrorMessage from '../shared/ui/ErrorMessage'
import Loading from '../shared/ui/Loading'

export default function PaymentsPage() {
  const { isAuthenticated } = useAuthToken()
  const [payments, setPayments] = useState<Payment[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const orderNumberById = useMemo(() => {
    const map = new Map<number, string>()
    for (const o of orders) map.set(o.id, o.order_number)
    return map
  }, [orders])

  useEffect(() => {
    if (!isAuthenticated) return

    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const [pay, ord] = await Promise.all([listPayments(), listOrders()])
        if (!cancelled) {
          setPayments(pay)
          setOrders(ord)
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to load payments'
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
      <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>

      {loading && <Loading label="Loading payments…" />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && (
        <div className="grid gap-3">
          {payments.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">No payments yet.</p>
          ) : (
            payments.map((p) => (
              <div
                key={p.id}
                className="grid gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="flex items-start justify-between gap-3">
                  <strong className="text-sm font-semibold">{p.payment_method}</strong>
                  <span className="text-sm font-semibold">{p.amount}</span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Status: {p.status}</div>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    Order:{' '}
                    <Link
                      to={`/orders/${p.order}`}
                      className="font-medium text-sky-700 hover:underline dark:text-sky-300"
                    >
                      {orderNumberById.get(p.order) ?? `Order #${p.order}`}
                    </Link>
                  </span>
                  {p.transaction_id ? (
                    <span>
                      • Transaction: <span className="font-medium">{p.transaction_id}</span>
                    </span>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
