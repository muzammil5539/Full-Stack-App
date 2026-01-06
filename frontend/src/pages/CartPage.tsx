import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { clearCart, getMyCart, removeCartItem, type Cart } from '../api/cart'
import { useAuthToken } from '../auth/useAuthToken'
import AuthRequired from '../shared/ui/AuthRequired'
import ErrorMessage from '../shared/ui/ErrorMessage'
import Loading from '../shared/ui/Loading'

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
    <div style={{ display: 'grid', gap: 10 }}>
      <h1 style={{ margin: 0 }}>Cart</h1>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          onClick={async () => {
            await clearCart()
            await refresh()
          }}
        >
          Clear cart
        </button>
        <Link to="/checkout">Continue to checkout →</Link>
      </div>

      {loading && <Loading label="Loading cart…" />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && cart && (
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <strong>Total items: {cart.total_items}</strong>
            <strong>Total: {cart.total_price}</strong>
          </div>

          {cart.items.length === 0 ? (
            <p style={{ margin: 0 }}>
              Empty. <Link to="/products">Browse products</Link>
            </p>
          ) : (
            cart.items.map((it) => (
              <div
                key={it.id}
                style={{
                  border: '1px solid rgba(127,127,127,0.35)',
                  borderRadius: 8,
                  padding: 12,
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ display: 'grid', gap: 4 }}>
                  <strong>{it.product_details?.name ?? `Product #${it.product}`}</strong>
                  <div style={{ fontSize: 13, opacity: 0.85 }}>
                    Qty: {it.quantity} • Price: {it.price} • Subtotal: {it.subtotal}
                  </div>
                </div>
                <button
                  onClick={async () => {
                    await removeCartItem(it.id)
                    await refresh()
                  }}
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
