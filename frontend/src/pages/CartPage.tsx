import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { clearCart, getMyCart, removeCartItem, type Cart } from '../api/cart'
import { useAuthToken } from '../auth/useAuthToken'
import AuthRequired from '../shared/ui/AuthRequired'
import ErrorMessage from '../shared/ui/ErrorMessage'
import Loading from '../shared/ui/Loading'

const buttonBase =
  'inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800'

const linkBase = 'text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300'

export default function CartPage() {
  const { isAuthenticated } = useAuthToken()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    try {
      setLoading(true)
      setError(null)
      const data = await getMyCart()
      setCart(data)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load cart'
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
        <h1 className="text-2xl font-semibold tracking-tight">Cart</h1>
        <div className="flex flex-wrap gap-2">
        <button
          onClick={async () => {
            await clearCart()
            await refresh()
          }}
          className={[buttonBase, 'h-9'].join(' ')}
        >
          Clear cart
        </button>
        <Link
          to="/checkout"
          className="inline-flex h-9 items-center rounded-md bg-sky-600 px-3 text-sm font-medium text-white hover:bg-sky-700"
        >
          Checkout
        </Link>
        </div>
      </div>

      {loading && <Loading label="Loading cart…" />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && cart && (
        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="text-sm font-semibold">Total items: {cart.total_items}</div>
            <div className="text-sm font-semibold">Total: {cart.total_price}</div>
          </div>

          {cart.items.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Empty.{' '}
              <Link to="/products" className={linkBase}>
                Browse products
              </Link>
              .
            </p>
          ) : (
            cart.items.map((it) => (
              <div
                key={it.id}
                className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="grid gap-1">
                  <strong className="text-sm font-semibold">{it.product_details?.name ?? `Product #${it.product}`}</strong>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Qty: {it.quantity} • Price: {it.price} • Subtotal: {it.subtotal}
                  </div>
                </div>
                <button
                  onClick={async () => {
                    await removeCartItem(it.id)
                    await refresh()
                  }}
                  className={[buttonBase, 'h-9'].join(' ')}
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
