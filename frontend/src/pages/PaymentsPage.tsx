import { useEffect, useState } from 'react'
import { listPayments, type Payment } from '../api/payments'
import { useAuthToken } from '../auth/useAuthToken'
import AuthRequired from '../shared/ui/AuthRequired'
import ErrorMessage from '../shared/ui/ErrorMessage'
import Loading from '../shared/ui/Loading'

export default function PaymentsPage() {
  const { isAuthenticated } = useAuthToken()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) return

    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const data = await listPayments()
        if (!cancelled) setPayments(data)
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
    <div style={{ display: 'grid', gap: 12 }}>
      <h1 style={{ margin: 0 }}>Payments</h1>

      {loading && <Loading label="Loading payments…" />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && (
        <div style={{ display: 'grid', gap: 10 }}>
          {payments.length === 0 ? (
            <p style={{ margin: 0 }}>No payments yet.</p>
          ) : (
            payments.map((p) => (
              <div
                key={p.id}
                style={{
                  border: '1px solid rgba(127,127,127,0.35)',
                  borderRadius: 8,
                  padding: 12,
                  display: 'grid',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <strong>{p.payment_method}</strong>
                  <span>{p.amount}</span>
                </div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>Status: {p.status}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
