import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { addCartItem } from '../../../api/cart'
import { listBrands, listCategories, type Brand, type Category } from '../../../api/products'
import { addWishlistItem } from '../../../api/wishlist'
import { useAuthToken } from '../../../auth/useAuthToken'
import ErrorMessage from '../../../shared/ui/ErrorMessage'
import Loading from '../../../shared/ui/Loading'
import { useProducts, type ProductsQuery } from '../hooks/useProducts'

const buttonBase =
  'inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800'

const inputBase =
  'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'

const linkBase = 'text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300'

function toInt(value: string | null): number | undefined {
  if (!value) return undefined
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : undefined
}

function normalizeSearch(value: string | null): string | undefined {
  const v = (value ?? '').trim()
  return v ? v : undefined
}

function setParam(params: URLSearchParams, key: string, value: string | undefined) {
  if (!value) params.delete(key)
  else params.set(key, value)
}

export default function ProductList() {
  const { isAuthenticated } = useAuthToken()
  const [searchParams, setSearchParams] = useSearchParams()
  const [cartPending, setCartPending] = useState<Record<number, boolean>>({})
  const [wishlistPending, setWishlistPending] = useState<Record<number, boolean>>({})

  const query: ProductsQuery = useMemo(() => {
    return {
      search: normalizeSearch(searchParams.get('search')),
      ordering: searchParams.get('ordering') ?? undefined,
      category: toInt(searchParams.get('category')),
      brand: toInt(searchParams.get('brand')),
      page: toInt(searchParams.get('page')) ?? 1,
      page_size: toInt(searchParams.get('page_size')) ?? 12,
    }
  }, [searchParams])

  const { products, loading, error, count, next, previous } = useProducts(query)

  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])

  // load categories/brands for filters (lazy)
  ;(async () => {
    if (categories.length === 0) {
      try {
        const c = await listCategories({ page_size: 100 })
        setCategories(c.results)
      } catch (e) {
        // ignore — filters are optional
      }
    }
    if (brands.length === 0) {
      try {
        const b = await listBrands({ page_size: 100 })
        setBrands(b.results)
      } catch (e) {
        // ignore
      }
    }
  })()

  function updateParam(k: string, v?: string) {
    const next = new URLSearchParams(searchParams)
    setParam(next, k, v)
    // reset to page 1 when filters change
    if (k !== 'page') next.delete('page')
    setSearchParams(next)
  }

  if (loading) return <Loading label="Loading products…" />
  if (error) return <ErrorMessage message={error} />

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-[1fr_280px]">
        <div className="grid gap-2">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <input
              aria-label="Search products"
              placeholder="Search products"
              className={inputBase}
              defaultValue={searchParams.get('search') ?? ''}
              onKeyDown={(e) => {
                if (e.key === 'Enter') updateParam('search', (e.target as HTMLInputElement).value)
              }}
            />

            <select
              aria-label="Sort" 
              className={inputBase}
              value={searchParams.get('ordering') ?? ''}
              onChange={(e) => updateParam('ordering', e.target.value || undefined)}
            >
              <option value="">Sort</option>
              <option value="price">Price: low → high</option>
              <option value="-price">Price: high → low</option>
              <option value="-created_at">Newest</option>
            </select>

            <select
              aria-label="Per page"
              className={inputBase}
              value={String(searchParams.get('page_size') ?? '')}
              onChange={(e) => updateParam('page_size', e.target.value || undefined)}
            >
              <option value="">Per page</option>
              <option value="8">8</option>
              <option value="12">12</option>
              <option value="24">24</option>
            </select>
          </div>

          <div className="grid gap-3">
            {products.length === 0 && <div className="text-sm text-slate-600">No products found.</div>}
            {products.map((p) => (
              <div key={p.id} className="grid gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link to={`/products/${p.slug}`} className={[linkBase, 'text-sm font-semibold'].join(' ')}>
                      {p.name}
                    </Link>
                    <div className="text-xs text-slate-500">{p.brand_name ?? ''}</div>
                  </div>
                  <div className="text-sm font-semibold">${p.price}</div>
                </div>

                <div className="flex gap-2">
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
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="hidden md:block">
          <div className="rounded-md border bg-white p-3">
            <h3 className="text-sm font-semibold">Filters</h3>
            <div className="mt-2 grid gap-2">
              <label className="text-xs">Category</label>
              <select
                className={inputBase}
                value={searchParams.get('category') ?? ''}
                onChange={(e) => updateParam('category', e.target.value || undefined)}
              >
                <option value="">All</option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
              </select>

              <label className="text-xs">Brand</label>
              <select
                className={inputBase}
                value={searchParams.get('brand') ?? ''}
                onChange={(e) => updateParam('brand', e.target.value || undefined)}
              >
                <option value="">All</option>
                {brands.map((b) => (
                  <option key={b.id} value={String(b.id)}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </aside>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">{count} products</div>
        <div className="flex items-center gap-2">
          <button
            disabled={!previous}
            onClick={() => updateParam('page', previous ? String(Number(searchParams.get('page') ?? '1') - 1) : undefined)}
            className={buttonBase}
          >
            Prev
          </button>
          <button
            disabled={!next}
            onClick={() => updateParam('page', next ? String(Number(searchParams.get('page') ?? '1') + 1) : undefined)}
            className={buttonBase}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
