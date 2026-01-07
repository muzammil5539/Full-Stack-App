import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createOrderFromCart } from '../api/orders'
import { useAuthToken } from '../auth/useAuthToken'
import AuthRequired from '../shared/ui/AuthRequired'
import ErrorMessage from '../shared/ui/ErrorMessage'

export default function CheckoutPage() {
  const { isAuthenticated } = useAuthToken()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isAuthenticated) return <AuthRequired />

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Starter page: add shipping address form, payment method selection, and place-order.
      </p>

      {error && <ErrorMessage message={error} />}

      <button
        disabled={loading}
        onClick={async () => {
          try {
            setLoading(true)
            setError(null)
            await createOrderFromCart({})
            navigate('/orders')
          } catch (e) {
            const message = e instanceof Error ? e.message : 'Failed to place order'
            setError(message)
          } finally {
            setLoading(false)
          }
        }}
        className="inline-flex h-10 items-center justify-center rounded-md bg-sky-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-sky-500"
      >
        {loading ? 'Placing order…' : 'Place order from cart'}
      </button>
    </div>
  )
}
