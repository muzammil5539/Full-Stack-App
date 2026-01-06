import { Link } from 'react-router-dom'
import { addCartItem } from '../../../api/cart'
import { addWishlistItem } from '../../../api/wishlist'
import { useAuthToken } from '../../../auth/useAuthToken'
import ErrorMessage from '../../../shared/ui/ErrorMessage'
import Loading from '../../../shared/ui/Loading'
import { useProducts } from '../hooks/useProducts'

export default function ProductList() {
  const { products, loading, error } = useProducts()
  const { isAuthenticated } = useAuthToken()

  if (loading) return <Loading label="Loading products…" />
  if (error) return <ErrorMessage message={error} />

  if (products.length === 0) {
    return <p style={{ margin: 0 }}>No products yet.</p>
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
            <Link to={`/products/${p.slug}`} className="text-sm">
              View
            </Link>
            <button
              disabled={!isAuthenticated}
              onClick={async () => {
                await addCartItem({ product: p.id, quantity: 1 })
              }}
              className="h-9"
            >
              Add to cart
            </button>
            <button
              disabled={!isAuthenticated}
              onClick={async () => {
                await addWishlistItem(p.id)
              }}
              className="h-9"
            >
              Wishlist
            </button>
            {!isAuthenticated && <span className="text-xs text-slate-500 dark:text-slate-400">Login to buy</span>}
          </div>
        </div>
      ))}
    </div>
  )
}
