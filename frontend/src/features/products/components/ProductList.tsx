import { useState } from 'react'
import { Link } from 'react-router-dom'
import { addCartItem } from '../../../api/cart'
import { addWishlistItem } from '../../../api/wishlist'
import { useAuthToken } from '../../../auth/useAuthToken'
import ErrorMessage from '../../../shared/ui/ErrorMessage'
import Loading from '../../../shared/ui/Loading'
import { useProducts } from '../hooks/useProducts'

const buttonBase =
  'inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800'

const linkBase = 'text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300'

export default function ProductList() {
  const { products, loading, error } = useProducts()
  const { isAuthenticated } = useAuthToken()
  const [cartPending, setCartPending] = useState<Record<number, boolean>>({})
  const [wishlistPending, setWishlistPending] = useState<Record<number, boolean>>({})

  if (loading) return <Loading label="Loading products…" />
  if (error) return <ErrorMessage message={error} />

  if (products.length === 0) {
    return <p className="m-0 text-sm text-slate-600 dark:text-slate-300">No products yet.</p>
  }

  return (
    <div className="grid gap-3">
      {products.map((p) => (
        <div
          key={p.id}
          className="grid gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950"
        >
          <div className="flex items-start justify-between gap-3">
            <strong className="text-sm font-semibold">{p.name}</strong>
            <span className="text-sm font-semibold">{p.price}</span>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Stock: {p.stock}</div>
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/products/${p.slug}`} className={[linkBase, 'text-sm'].join(' ')}>
              View
            </Link>
            <button
              disabled={!isAuthenticated || Boolean(cartPending[p.id])}
              onClick={async () => {
                if (cartPending[p.id]) return
                try {
                  setCartPending((prev) => ({ ...prev, [p.id]: true }))
                  await addCartItem({ product: p.id, quantity: 1 })
                } finally {
                  setCartPending((prev) => {
                    const next = { ...prev }
                    delete next[p.id]
                    return next
                  })
                }
              }}
              className={[buttonBase, 'h-9'].join(' ')}
            >
              {cartPending[p.id] ? 'Adding…' : 'Add to cart'}
            </button>
            <button
              disabled={!isAuthenticated || Boolean(wishlistPending[p.id])}
              onClick={async () => {
                if (wishlistPending[p.id]) return
                try {
                  setWishlistPending((prev) => ({ ...prev, [p.id]: true }))
                  await addWishlistItem(p.id)
                } finally {
                  setWishlistPending((prev) => {
                    const next = { ...prev }
                    delete next[p.id]
                    return next
                  })
                }
              }}
              className={[buttonBase, 'h-9'].join(' ')}
            >
              {wishlistPending[p.id] ? 'Saving…' : 'Wishlist'}
            </button>
            {!isAuthenticated && <span className="text-xs text-slate-500 dark:text-slate-400">Login to buy</span>}
          </div>
        </div>
      ))}
    </div>
  )
}
