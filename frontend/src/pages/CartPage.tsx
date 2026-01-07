import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { clearCart, getMyCart, removeCartItem, type Cart } from '../api/cart'
import { useAuthToken } from '../auth/useAuthToken'
import AuthRequired from '../shared/ui/AuthRequired'
import ErrorMessage from '../shared/ui/ErrorMessage'
import Loading from '../shared/ui/Loading'

const buttonBase =
  'inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800'

const linkBase = 'text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300'

const checkboxBase = 'h-4 w-4 rounded border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950'

export default function CartPage() {
  const { isAuthenticated } = useAuthToken()
  const [cart, setCart] = useState<Cart | null>(null)
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    try {
      setLoading(true)
      setError(null)
      const data = await getMyCart()
      setCart(data)
      // Default: select all items when cart loads/changes
      setSelectedItemIds(data.items.map((i) => i.id))
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load cart'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const allIds = useMemo(() => (cart ? cart.items.map((i) => i.id) : []), [cart])
  const allSelected = cart ? selectedItemIds.length > 0 && selectedItemIds.length === cart.items.length : false

  const checkoutTo = useMemo(() => {
    if (!selectedItemIds.length) return '/checkout'
    return `/checkout?items=${encodeURIComponent(selectedItemIds.join(','))}`
  }, [selectedItemIds])

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
          to={checkoutTo}
          className={[
            'inline-flex h-9 items-center rounded-md bg-sky-600 px-3 text-sm font-medium text-white hover:bg-sky-700',
            selectedItemIds.length ? '' : 'pointer-events-none opacity-60',
          ].join(' ')}
        >
          Checkout selected
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

          {cart.items.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-950">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className={checkboxBase}
                  checked={allSelected}
                  onChange={(e) => {
                    setSelectedItemIds(e.target.checked ? allIds : [])
                  }}
                />
                Select all
              </label>
              <div className="text-slate-600 dark:text-slate-300">Selected: {selectedItemIds.length}</div>
            </div>
          ) : null}

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
                <div className="flex min-w-0 items-start gap-3">
                  <input
                    type="checkbox"
                    className={[checkboxBase, 'mt-1'].join(' ')}
                    checked={selectedItemIds.includes(it.id)}
                    onChange={(e) => {
                      setSelectedItemIds((prev) => {
                        if (e.target.checked) return prev.includes(it.id) ? prev : [...prev, it.id]
                        return prev.filter((id) => id !== it.id)
                      })
                    }}
                  />

                  <div className="grid min-w-0 gap-1">
                  <strong className="text-sm font-semibold">{it.product_details?.name ?? `Product #${it.product}`}</strong>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Qty: {it.quantity} • Price: {it.price} • Subtotal: {it.subtotal}
                  </div>
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
