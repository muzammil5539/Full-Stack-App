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
    <div style={{ display: 'grid', gap: 10 }}>
      {products.map((p) => (
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
            <strong>{p.name}</strong>
            <span>{p.price}</span>
          </div>
          <div style={{ fontSize: 13, opacity: 0.8 }}>Stock: {p.stock}</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <Link to={`/products/${p.slug}`}>View</Link>
            <button
              disabled={!isAuthenticated}
              onClick={async () => {
                await addCartItem({ product: p.id, quantity: 1 })
              }}
            >
              Add to cart
            </button>
            <button
              disabled={!isAuthenticated}
              onClick={async () => {
                await addWishlistItem(p.id)
              }}
            >
              Wishlist
            </button>
            {!isAuthenticated && <span style={{ fontSize: 12, opacity: 0.8 }}>Login to buy</span>}
          </div>
        </div>
      ))}
    </div>
  )
}
