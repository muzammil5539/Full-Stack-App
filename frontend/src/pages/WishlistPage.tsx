import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyWishlist, removeWishlistItem, type Wishlist } from '../api/wishlist'
import { useAuthToken } from '../auth/useAuthToken'
import AuthRequired from '../shared/ui/AuthRequired'
import ErrorMessage from '../shared/ui/ErrorMessage'
import Loading from '../shared/ui/Loading'

export default function WishlistPage() {
  const { isAuthenticated } = useAuthToken()
  const [wishlist, setWishlist] = useState<Wishlist | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    try {
      setLoading(true)
      setError(null)
      const data = await getMyWishlist()
      setWishlist(data)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load wishlist'
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
    <div style={{ display: 'grid', gap: 12 }}>
      <h1 style={{ margin: 0 }}>Wishlist</h1>

      {loading && <Loading label="Loading wishlist…" />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && wishlist && (
        <div style={{ display: 'grid', gap: 10 }}>
          {wishlist.items.length === 0 ? (
            <p style={{ margin: 0 }}>
              Empty. <Link to="/products">Browse products</Link>
            </p>
          ) : (
            wishlist.items.map((it) => (
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
                  {it.product_details?.slug && (
                    <Link to={`/products/${it.product_details.slug}`}>View</Link>
                  )}
                </div>
                <button
                  onClick={async () => {
                    await removeWishlistItem(it.product)
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
