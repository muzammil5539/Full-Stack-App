import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getMyCart, type CartItem } from '../api/cart'
import { createOrderFromCart } from '../api/orders'
import { useAuthToken } from '../auth/useAuthToken'
import AuthRequired from '../shared/ui/AuthRequired'
import ErrorMessage from '../shared/ui/ErrorMessage'
import Loading from '../shared/ui/Loading'

export default function CheckoutPage() {
  const { isAuthenticated } = useAuthToken()
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartLoading, setCartLoading] = useState(false)

  const selectedIds = useMemo(() => {
    const qs = new URLSearchParams(location.search)
    const raw = (qs.get('items') ?? '').trim()
    if (!raw) return null
    const ids = raw
      .split(',')
      .map((s) => Number(s))
      .filter((n) => Number.isFinite(n) && n > 0)
    return ids.length ? ids : null
  }, [location.search])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setCartLoading(true)
        setError(null)
        const cart = await getMyCart()
        if (!cancelled) {
          setCartItems(cart.items)
        }
      } catch (e) {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : 'Failed to load cart'
          setError(message)
        }
      } finally {
        if (!cancelled) {
          setCartLoading(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const itemsToCheckout = useMemo(() => {
    if (!selectedIds) return cartItems
    const set = new Set(selectedIds)
    return cartItems.filter((i) => set.has(i.id))
  }, [cartItems, selectedIds])

  if (!isAuthenticated) return <AuthRequired />

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Starter page: add shipping address form, payment method selection, and place-order.
      </p>

      {cartLoading ? <Loading label="Loading selected items…" /> : null}
      {error && <ErrorMessage message={error} />}

      {!cartLoading && !error ? (
        itemsToCheckout.length === 0 ? (
          <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
            No items selected for checkout.
          </div>
        ) : (
          <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="text-sm font-semibold">Items ({itemsToCheckout.length})</div>
            <ul className="grid gap-2">
              {itemsToCheckout.map((it) => (
                <li key={it.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {it.product_details?.name ?? `Product #${it.product}`}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Qty: {it.quantity}</div>
                  </div>
                  <div className="text-sm font-semibold">{it.subtotal}</div>
                </li>
              ))}
            </ul>
          </div>
        )
      ) : null}

      <button
        disabled={loading || itemsToCheckout.length === 0}
        onClick={async () => {
          try {
            setLoading(true)
            setError(null)
            const itemIds = itemsToCheckout.map((i) => i.id)
            await createOrderFromCart({ item_ids: itemIds })
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
