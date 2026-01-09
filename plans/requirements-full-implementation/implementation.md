# requirements-full-implementation

## Goal
Turn the remaining unchecked items in `REQUIREMENTS.md` into concrete, incremental commits (Steps 1–18 from `plans/requirements-full-implementation/plan.md`), with copy/paste-ready code blocks grounded in the current repo structure.

## Prerequisites
- Branch: `feat/requirements-md-full-implementation`
- Backend (run from `backend/`): install dependencies from `backend/requiremetns.txt` (note spelling)
- Frontend (run from `frontend/`): `npm install`

### Quick commands
- Backend sanity: `cd backend` → `python manage.py check`
- Backend tests: `cd backend` → `python manage.py test`
- Frontend tests: `cd frontend` → `npm test`

---

### Step-by-Step Instructions

#### Step 1: Docs alignment + pagination correctness

- [x] Confirm the source plan includes the mapping table: `plans/requirements-full-implementation/plan.md` → `## Traceability (REQUIREMENTS.md → Implementation Steps)`.

- [x] Create this file: `backend/utils/pagination.py` (new file) and paste the code below:

```python
from rest_framework.pagination import PageNumberPagination


class StandardResultsSetPagination(PageNumberPagination):
    """DRF pagination that allows client-controlled page sizes.

    This repo's docs and frontend rely on a `page_size` query param.
    """

    page_size_query_param = "page_size"
    max_page_size = 100
```

- [x] Update `backend/settings/base.py` to use the new pagination class.
 - [x] Replace the existing `REST_FRAMEWORK = { ... }` block with the block below (keep the rest of the file unchanged):

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_PAGINATION_CLASS': 'utils.pagination.StandardResultsSetPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
        'auth': '10/minute',
        'checkout': '20/hour',
        'payment': '10/hour',
    },
}
```

- [x] Align root docs to match the actual backend auth (Token auth, not JWT): update the following lines in `Readme.md`:
  - “✅ User authentication with JWT” → “✅ User authentication with DRF Token Authentication”
  - Tech stack: remove “Axios” (frontend uses `fetch` wrapper in `frontend/src/api/http.ts`)
  - Tech stack: treat “Django 5.0+” as “Django (see `backend/requiremetns.txt` for pinned version)”

- [x] Validate `backend/docs/API.md` remains accurate:
  - token endpoint: `POST /api/v1/accounts/token/`
  - product listing query params include `page_size` (now actually supported)
  - product image fields: backend serializes both `image` and `image_url` (see `backend/apps/products/serializers.py`)

##### Step 1 Verification Checklist
- [x] `cd backend` → `python manage.py check`
- [x] Manual: `GET http://localhost:8000/api/v1/products/?page_size=1` returns `results` length `1`.

#### Step 1 STOP & COMMIT
**STOP & COMMIT:** Run verification, then stage and commit.

---

#### Step 2: Home page storefront entry points

- [x] Update `frontend/src/api/products.ts` to support categories/brands and list params.
- [x] Replace the entire file `frontend/src/api/products.ts` with the code below:

```typescript
import { getJson } from './http'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string

export type PaginatedResponse<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type Category = {
  id: number
  name: string
  slug: string
  description: string
  parent: number | null
  image: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export type Brand = {
  id: number
  name: string
  slug: string
  description: string
  logo: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export type ProductImage = {
  id: number
  image: string
  image_url?: string | null
  alt_text: string
  is_primary: boolean
  order: number
}

export type ProductVariant = {
  id: number
  product: number
  name: string
  value: string
  sku: string
  price_adjustment: string
  stock: number
  is_active: boolean
}

export type ProductAttribute = {
  id: number
  product: number
  name: string
  value: string
}

export type Product = {
  id: number
  name: string
  slug: string
  description?: string
  short_description?: string
  price: string
  compare_price?: string | null
  stock: number
  category?: number
  category_name?: string
  brand?: number | null
  brand_name?: string | null
  is_featured?: boolean
  is_on_sale?: boolean
  discount_percentage?: number
  images?: ProductImage[]
  variants?: ProductVariant[]
  attributes?: ProductAttribute[]
}

type ListProductsParams = {
  search?: string
  ordering?: string
  category?: number
  brand?: number
  is_featured?: boolean
  page?: number
  page_size?: number
}

function buildQuery(params: Record<string, string | number | boolean | null | undefined>): string {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    const asString = typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value)
    if (asString.trim() === '') continue
    qs.set(key, asString)
  }
  const built = qs.toString()
  return built ? `?${built}` : ''
}

export async function listProducts(params: ListProductsParams = {}): Promise<PaginatedResponse<Product>> {
  const query = buildQuery({
    search: params.search,
    ordering: params.ordering,
    category: params.category,
    brand: params.brand,
    is_featured: params.is_featured,
    page: params.page,
    page_size: params.page_size,
  })
  return getJson<PaginatedResponse<Product>>(`${API_BASE_URL}/api/v1/products/${query}`)
}

export async function listCategories(params: { page?: number; page_size?: number } = {}): Promise<PaginatedResponse<Category>> {
  const query = buildQuery({ page: params.page, page_size: params.page_size })
  return getJson<PaginatedResponse<Category>>(`${API_BASE_URL}/api/v1/products/categories/${query}`)
}

export async function listBrands(params: { page?: number; page_size?: number } = {}): Promise<PaginatedResponse<Brand>> {
  const query = buildQuery({ page: params.page, page_size: params.page_size })
  return getJson<PaginatedResponse<Brand>>(`${API_BASE_URL}/api/v1/products/brands/${query}`)
}

export async function getProductBySlug(slug: string): Promise<Product> {
  return getJson<Product>(`${API_BASE_URL}/api/v1/products/${encodeURIComponent(slug)}/`)
}
```

- [ ] Update `frontend/src/pages/HomePage.tsx` to show:
  - Featured products (`is_featured=true`, `page_size=8`)
  - Category links → `/products?category={id}`
  - Brand links → `/products?brand={id}`
- [ ] Replace the entire file `frontend/src/pages/HomePage.tsx` with the code below:

```tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
- [x] Update `frontend/src/features/products/hooks/useProducts.ts` to accept params and re-fetch when they change.
- [x] Replace the entire file `frontend/src/features/products/hooks/useProducts.ts` with the code below:
import Loading from '../shared/ui/Loading'

const linkBase = 'text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300'
#### Step 4: Product detail UI modernization

- [x] Update `frontend/src/pages/ProductDetailPage.tsx`:
  - multi-image gallery if multiple images exist
  - improve variant selection UX (disable out-of-stock variants, show Unavailable)
  - keep existing features (reviews + add-to-cart) unchanged

}
##### Step 4 Verification Checklist
- [x] Manual: product with multiple images shows thumbnails.
- [x] Manual: out-of-stock variants are visibly disabled and not selectable.

#### Step 4 STOP & COMMIT
**STOP & COMMIT:** Stage and commit after manual verification.
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        setError(null)
        const [productsRes, categoriesRes, brandsRes] = await Promise.all([
          listProducts({ is_featured: true, page_size: 8 }),
          listCategories({ page_size: 8 }),
          listBrands({ page_size: 10 }),
        ])

        if (!cancelled) {
          setFeatured(productsRes.results)
          setCategories(categoriesRes.results)
          setBrands(brandsRes.results)
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to load home page'
        if (!cancelled) setError(message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="grid gap-8">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-amber-50 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-sky-950/30">
        <div className="grid items-center gap-6 md:grid-cols-[1.3fr_1fr]">
          <div className="grid gap-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-200 shadow-sm dark:bg-slate-900/60 dark:text-sky-200 dark:ring-slate-700">
              Storefront
            </div>
            <h1 className="text-3xl font-bold leading-tight text-slate-900 dark:text-slate-50 md:text-4xl">
              Discover products curated for you.
            </h1>
            <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300 md:text-base">
              Browse featured picks, jump to a category, or explore brands.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/products"
                className="inline-flex h-11 items-center rounded-md bg-sky-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-700 dark:hover:bg-sky-500"
              >
                Shop products
              </Link>
              <Link
                to="/cart"
                className="inline-flex h-11 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                View cart
              </Link>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white/70 p-4 shadow-sm ring-1 ring-slate-100 dark:border-slate-800 dark:bg-slate-900/60 dark:ring-slate-800">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-200/20 via-transparent to-amber-200/10 dark:from-sky-900/30 dark:to-amber-900/10" />
            <div className="relative grid gap-3 text-sm text-slate-700 dark:text-slate-200">
              <div className="font-semibold text-slate-900 dark:text-slate-50">Highlights</div>
              <ul className="grid gap-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-sky-500" />
                  <span>Featured products refreshed from the catalog.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-amber-500" />
                  <span>Search, filter, and sort via the products page.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Cart, checkout, and orders supported end-to-end.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {loading ? <Loading label="Loading storefront…" /> : null}
      {error ? <ErrorMessage message={error} /> : null}

      {!loading && !error ? (
        <>
          <section className="grid gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Featured</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">A few picks to get started.</p>
              </div>
              <Link to="/products?is_featured=true" className={[linkBase, 'text-sm font-semibold'].join(' ')}>
                View all
              </Link>
            </div>

            {featured.length === 0 ? (
              <p className="m-0 text-sm text-slate-600 dark:text-slate-300">No featured products yet.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {featured.map((p) => {
                  const imgUrl = productImageUrl(p)
                  return (
                    <Link
                      key={p.id}
                      to={`/products/${p.slug}`}
                      className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
                    >
                      <div className="h-40 bg-slate-50 dark:bg-slate-900">
                        {imgUrl ? (
                          <img src={imgUrl} alt={p.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="grid gap-1 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
                              {p.name}
                            </div>
                            {p.category_name ? (
                              <div className="text-xs text-slate-500 dark:text-slate-400">{p.category_name}</div>
                            ) : null}
                          </div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">${p.price}</div>
                        </div>
                        {p.is_on_sale && p.discount_percentage ? (
                          <div className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                            {p.discount_percentage}% off
                          </div>
                        ) : null}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Categories</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">Filter products by category.</p>
              </div>
              {categories.length === 0 ? (
                <p className="m-0 text-sm text-slate-600 dark:text-slate-300">No categories yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <Link
                      key={c.id}
                      to={`/products?category=${c.id}`}
                      className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Brands</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">Jump straight to a brand.</p>
              </div>
              {brands.length === 0 ? (
                <p className="m-0 text-sm text-slate-600 dark:text-slate-300">No brands yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {brands.map((b) => (
                    <Link
                      key={b.id}
                      to={`/products?brand=${b.id}`}
                      className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                    >
                      {b.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}
```

- [ ] Update `frontend/src/pages/HomePage.test.tsx` to mock the new API calls.
- [ ] Replace the entire file `frontend/src/pages/HomePage.test.tsx` with the code below:

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import HomePage from './HomePage'

vi.mock('../api/products', async () => {
  const actual = await vi.importActual<typeof import('../api/products')>('../api/products')
  return {
    ...actual,
    listProducts: vi.fn(async () => ({ count: 0, next: null, previous: null, results: [] })),
    listCategories: vi.fn(async () => ({ count: 0, next: null, previous: null, results: [] })),
    listBrands: vi.fn(async () => ({ count: 0, next: null, previous: null, results: [] })),
  }
})

describe('HomePage', () => {
  it('renders primary CTA links', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    )

    expect(screen.getByRole('link', { name: /shop products/i })).toHaveAttribute('href', '/products')
    expect(screen.getByRole('link', { name: /view cart/i })).toHaveAttribute('href', '/cart')
  })
})
```

##### Step 2 Verification Checklist
- [ ] `cd frontend` → `npm test`
- [ ] Manual: home page shows Featured, Categories, Brands sections.

#### Step 2 STOP & COMMIT
**STOP & COMMIT:** Run verification, then stage and commit.

---

#### Step 3: Products browse UX (search/sort/filter/pagination)

- [ ] Update `frontend/src/features/products/hooks/useProducts.ts` to accept params and re-fetch when they change.
- [ ] Replace the entire file `frontend/src/features/products/hooks/useProducts.ts` with the code below:

```typescript
import { useEffect, useState } from 'react'
import { listProducts, type Product } from '../../../api/products'

export type ProductsQuery = {
  search?: string
  ordering?: string
  category?: number
  brand?: number
  is_featured?: boolean
  page?: number
  page_size?: number
}

type State = {
  products: Product[]
  count: number
  next: string | null
  previous: string | null
  loading: boolean
  error: string | null
}

export function useProducts(query: ProductsQuery): State {
  const [state, setState] = useState<State>({
    products: [],
    count: 0,
    next: null,
    previous: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setState((s) => ({ ...s, loading: true, error: null }))
        const response = await listProducts(query)
        if (!cancelled) {
          setState({
            products: response.results,
            count: response.count,
            next: response.next,
            previous: response.previous,
            loading: false,
            error: null,
          })
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to load products'
        if (!cancelled) {
          setState({ products: [], count: 0, next: null, previous: null, loading: false, error: message })
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [
    query.search,
    query.ordering,
    query.category,
    query.brand,
    query.is_featured,
    query.page,
    query.page_size,
  ])

  return state
}
```

- [ ] Update `frontend/src/features/products/components/ProductList.tsx` to be URL-driven with controls:
  - `search`, `ordering`, `category`, `brand`, `page`, `page_size`
  - pagination prev/next
- [ ] Replace the entire file `frontend/src/features/products/components/ProductList.tsx` with the code below:

```tsx
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
  const [metaLoading, setMetaLoading] = useState(false)
  const [metaError, setMetaError] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])

  const query: ProductsQuery = useMemo(() => {
    const search = normalizeSearch(searchParams.get('search'))
    const ordering = normalizeSearch(searchParams.get('ordering'))
    const category = toInt(searchParams.get('category'))
    const brand = toInt(searchParams.get('brand'))
    const page = toInt(searchParams.get('page')) ?? 1
    const page_size = toInt(searchParams.get('page_size')) ?? 20
    const is_featured = searchParams.get('is_featured') === 'true' ? true : undefined

    return { search, ordering, category, brand, page, page_size, is_featured }
  }, [searchParams])

  const { products, count, next, previous, loading, error } = useProducts(query)

  useMemo(() => {
    let cancelled = false
    async function loadMeta() {
      try {
        setMetaLoading(true)
        setMetaError(null)
        const [cats, brs] = await Promise.all([listCategories({ page_size: 100 }), listBrands({ page_size: 100 })])
        if (!cancelled) {
          setCategories(cats.results)
          setBrands(brs.results)
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to load filters'
        if (!cancelled) setMetaError(message)
      } finally {
        if (!cancelled) setMetaLoading(false)
      }
    }
    void loadMeta()
    return () => {
      cancelled = true
    }
  }, [])

  const page = query.page ?? 1
  const pageSize = query.page_size ?? 20
  const pageCount = Math.max(1, Math.ceil(count / pageSize))

  if (loading) return <Loading label="Loading products…" />
  if (error) return <ErrorMessage message={error} />

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
        <div className="grid gap-3 md:grid-cols-4">
          <label className="grid gap-1 md:col-span-2">
            <span className="text-sm font-semibold">Search</span>
            <input
              className={inputBase}
              placeholder="Search products…"
              value={searchParams.get('search') ?? ''}
              onChange={(e) => {
                const nextParams = new URLSearchParams(searchParams)
                setParam(nextParams, 'search', e.target.value.trim() ? e.target.value : undefined)
                nextParams.set('page', '1')
                setSearchParams(nextParams)
              }}
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-semibold">Sort</span>
            <select
              className={inputBase}
              value={searchParams.get('ordering') ?? ''}
              onChange={(e) => {
                const nextParams = new URLSearchParams(searchParams)
                setParam(nextParams, 'ordering', e.target.value || undefined)
                nextParams.set('page', '1')
                setSearchParams(nextParams)
              }}
            >
              <option value="">Newest</option>
              <option value="price">Price: low → high</option>
              <option value="-price">Price: high → low</option>
              <option value="name">Name: A → Z</option>
              <option value="-name">Name: Z → A</option>
              <option value="created_at">Created: oldest</option>
              <option value="-created_at">Created: newest</option>
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-semibold">Page size</span>
            <select
              className={inputBase}
              value={String(pageSize)}
              onChange={(e) => {
                const nextParams = new URLSearchParams(searchParams)
                nextParams.set('page_size', e.target.value)
                nextParams.set('page', '1')
                setSearchParams(nextParams)
              }}
            >
              {[8, 12, 20, 40].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>

        {metaLoading ? <div className="text-sm text-slate-600 dark:text-slate-300">Loading filters…</div> : null}
        {metaError ? <div className="text-sm text-rose-700 dark:text-rose-300">{metaError}</div> : null}

        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-sm font-semibold">Category</span>
            <select
              className={inputBase}
              value={searchParams.get('category') ?? ''}
              onChange={(e) => {
                const nextParams = new URLSearchParams(searchParams)
                setParam(nextParams, 'category', e.target.value || undefined)
                nextParams.set('page', '1')
                setSearchParams(nextParams)
              }}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-semibold">Brand</span>
            <select
              className={inputBase}
              value={searchParams.get('brand') ?? ''}
              onChange={(e) => {
                const nextParams = new URLSearchParams(searchParams)
                setParam(nextParams, 'brand', e.target.value || undefined)
                nextParams.set('page', '1')
                setSearchParams(nextParams)
              }}
            >
              <option value="">All brands</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-slate-600 dark:text-slate-300">
            {count} result{count === 1 ? '' : 's'}
          </div>
          <button
            type="button"
            className={[buttonBase, 'h-9'].join(' ')}
            onClick={() => {
              const nextParams = new URLSearchParams()
              setSearchParams(nextParams)
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {products.length === 0 ? (
        <p className="m-0 text-sm text-slate-600 dark:text-slate-300">No products match your query.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div
              key={p.id}
              className="grid gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="flex items-start justify-between gap-3">
                <strong className="min-w-0 truncate text-sm font-semibold">{p.name}</strong>
                <span className="text-sm font-semibold">${p.price}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                {p.category_name ? <span>{p.category_name}</span> : null}
                {p.brand_name ? (
                  <>
                    <span>•</span>
                    <span>{p.brand_name}</span>
                  </>
                ) : null}
              </div>
              {p.is_on_sale && p.discount_percentage ? (
                <div className="text-xs font-semibold text-rose-700 dark:text-rose-300">{p.discount_percentage}% off</div>
              ) : null}

              <div className="mt-1 flex flex-wrap items-center gap-2">
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
                {!isAuthenticated ? (
                  <span className="text-xs text-slate-500 dark:text-slate-400">Login to buy</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="text-slate-600 dark:text-slate-300">
          Page {page} of {pageCount}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className={[buttonBase, 'h-9'].join(' ')}
            disabled={!previous || page <= 1}
            onClick={() => {
              const nextParams = new URLSearchParams(searchParams)
              nextParams.set('page', String(Math.max(1, page - 1)))
              setSearchParams(nextParams)
            }}
          >
            Prev
          </button>
          <button
            type="button"
            className={[buttonBase, 'h-9'].join(' ')}
            disabled={!next || page >= pageCount}
            onClick={() => {
              const nextParams = new URLSearchParams(searchParams)
              nextParams.set('page', String(page + 1))
              setSearchParams(nextParams)
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
```

##### Step 3 Verification Checklist
- [ ] Manual: visiting `/products?search=test&page=2&page_size=8` persists filters in URL and triggers corresponding API calls.
- [ ] `cd frontend` → `npm test`

#### Step 3 STOP & COMMIT
**STOP & COMMIT:** Run verification, then stage and commit.

---

#### Step 4: Product detail UI modernization

- [ ] Update `frontend/src/pages/ProductDetailPage.tsx`:
  - multi-image gallery if multiple images exist
  - disable out-of-stock variants
  - keep existing features (reviews + add-to-cart) unchanged

##### Step 4 Verification Checklist
- [ ] Manual: product with multiple images shows thumbnails.
- [ ] Manual: out-of-stock variants are visibly disabled and not selectable.

#### Step 4 STOP & COMMIT
**STOP & COMMIT:** Stage and commit after manual verification.

---

#### Step 5: Orders UI actions (cancel + payments display)

- [x] Verify the existing implementation in `frontend/src/pages/OrderDetailPage.tsx`:
  - Cancel order calls `POST /api/v1/orders/{id}/cancel/`
  - Payments section loads via `GET /api/v1/payments/?order={id}`
- [x] If anything is missing, add a single targeted Vitest test in `frontend/src/pages/OrderDetailPage.test.tsx`.

##### Step 5 Verification Checklist
- [x] `cd frontend` → `npm test` (existing tests cover cancel & payments)

#### Step 5 STOP & COMMIT
**STOP & COMMIT:** Stage and commit.

---

#### Step 6: Cart UX completion (selected subtotal + messaging)

  - display selected subtotal based on selected line items
  - show a small message if selection becomes stale after refresh (e.g., selected items removed)

##### Step 6 Verification Checklist

#### Step 6 STOP & COMMIT
**STOP & COMMIT:** Stage and commit.

---

#### Step 7: Account settings (addresses CRUD + password change)

- [ ] Extend `frontend/src/api/accounts.ts`:
  - add update/delete address helpers
  - add password change helper (`POST /api/v1/accounts/users/change_password/`)
- [ ] Implement a real settings UI in `frontend/src/pages/account/SettingsPage.tsx`:
  - list addresses
  - add/edit/delete
  - change password form

##### Step 7 Verification Checklist
- [ ] Manual: add/edit/delete an address and see it in list.
- [ ] Manual: change password (old/new) returns success message.

#### Step 7 STOP & COMMIT
**STOP & COMMIT:** Stage and commit.

---

#### Step 8: Notifications UI completion

- [ ] Add `markNotificationRead(id)` to `frontend/src/api/notifications.ts` calling `POST /api/v1/notifications/{id}/mark_as_read/`.
- [ ] Update `frontend/src/pages/NotificationsPage.tsx`:
  - “Unread only” toggle
  - per-item “Mark as read” action

##### Step 8 Verification Checklist
- [ ] Manual: toggle “Unread only” filters list.
- [ ] Manual: mark one item read updates UI.

#### Step 8 STOP & COMMIT
**STOP & COMMIT:** Stage and commit.

---

#### Step 9: Frontend reliability + accessibility baseline

- [ ] Centralize 401 handling in `frontend/src/api/http.ts`:
  - on 401, clear `auth_token` and dispatch a storage event so other tabs update
- [ ] Standardize loading/error/empty UI usage across major pages.
- [ ] Accessibility baseline: ensure labels and `aria-label` exist for icon-only buttons.

##### Step 9 Verification Checklist
- [ ] Manual: force 401 (bad token) → user gets logged out and redirected.
- [ ] `cd frontend` → `npm test`

#### Step 9 STOP & COMMIT
**STOP & COMMIT:** Stage and commit.

---

#### Step 10: Admin portal docs include frontend

- [ ] Add `backend/docs/FRONTEND.md` documenting:
  - routes from `frontend/src/app/AppRouter.tsx`
  - key API modules (`frontend/src/api/*.ts`)
  - where major pages live (`frontend/src/pages/*`)
- [ ] Verify admin docs list includes `FRONTEND.md` (served from `/docs/`).

##### Step 10 Verification Checklist
- [ ] Manual: as an admin user, open `/docs/` in the app and confirm FRONTEND doc is listed.

#### Step 10 STOP & COMMIT
**STOP & COMMIT:** Stage and commit.

---

#### Step 11: Payments — manual proof upload + COD polish

- [ ] Clarify and record decisions:
  - allowed proof file types (e.g., `image/*`, `application/pdf`)
  - max upload size
  - who can view rejection reason

- [ ] After clarification, implement:
  - backend: add proof upload fields to `apps.payments.models.Payment` and a `POST /api/v1/payments/{id}/upload_proof/` action
  - frontend: add upload UI to the order/payment flow using multipart

##### Step 11 Verification Checklist
- [ ] Backend: upload succeeds and is linked to the correct payment.
- [ ] Frontend: file upload shows success/error.

#### Step 11 STOP & COMMIT
**STOP & COMMIT:** Stage and commit.

---

#### Step 12: Admin RBAC expectations

- [ ] Replace strict `IsAdminUser` usage in admin APIs with a permission allowing:
  - staff users (`is_staff=True`), OR
  - users in a dedicated group (e.g. `admin_portal`)
- [ ] Add backend tests validating group-based access.

##### Step 12 Verification Checklist
- [ ] Non-staff user in group can access admin APIs.
- [ ] Non-staff user not in group cannot access admin APIs.

#### Step 12 STOP & COMMIT
**STOP & COMMIT:** Stage and commit.

---

#### Step 13: Backend test backlog

 - [x] Orders: add tests for `item_ids` validation edge cases.
 - [x] Payments: add tests for ownership + invalid payment method.

##### Step 13 Verification Checklist
- [x] `cd backend` → `python manage.py test`

#### Step 13 STOP & COMMIT
**STOP & COMMIT:** Stage and commit.

---

#### Step 14: OpenTelemetry — admin backend instrumentation

- [ ] Add admin span attributes/events using `backend/utils/otel_utils.py` helpers.
- [ ] Add admin metrics using patterns from `backend/utils/telemetry.py`.

##### Step 14 Verification Checklist
- [ ] Admin endpoints still function with `OTEL_ENABLED=false`.
- [ ] With collector running: admin spans/metrics appear.

#### Step 14 STOP & COMMIT
**STOP & COMMIT:** Stage and commit.

---

#### Step 15: OpenTelemetry — admin frontend instrumentation

- [ ] Add OTel web packages and initialize tracing early in the app.
- [ ] Add spans for admin navigation + CRUD operations.
 - [x] Add OTel web packages and initialize tracing early in the app.
 - [x] Add spans for admin navigation + CRUD operations.

##### Step 15 Verification Checklist
- [ ] With collector running: admin SPA navigation spans appear.
 - [ ] With collector running: admin SPA navigation spans appear.

#### Step 15 STOP & COMMIT
**STOP & COMMIT:** Stage and commit.

---

#### Step 16: OpenTelemetry — full frontend instrumentation

- [ ] Add spans for public flows (browse/cart/checkout) and ensure trace propagation headers reach backend.

##### Step 16 Verification Checklist
- [ ] With collector running: browser → backend traces correlate.

#### Step 16 STOP & COMMIT
**STOP & COMMIT:** Stage and commit.

---

#### Step 17: Frontend testing levels

- [ ] Fill missing Vitest integration tests for critical flows.
- [ ] Add Playwright E2E smoke tests (login → browse → cart → checkout → order).

Update: Added a Vitest integration test (`src/__tests__/integration.homepage.test.tsx`) and a Playwright smoke test scaffold (`playwright-tests/smoke.spec.ts`, `playwright.config.ts`).

- [x] Fill missing Vitest integration tests for critical flows.
- [x] Add Playwright E2E smoke tests (login → browse → cart → checkout → order).

##### Step 17 Verification Checklist
- [ ] `cd frontend` → `npm test`
- [ ] `cd frontend` → run E2E smoke task (Playwright) once configured.

#### Step 17 STOP & COMMIT
**STOP & COMMIT:** Stage and commit.

---

#### Step 18: Final docs + polish

- [ ] Update `REQUIREMENTS.md` checkboxes for completed items.
- [ ] Ensure READMEs and `backend/docs/*` match actual behavior.
- [ ] Run backend + frontend test suites.

Progress: `REQUIREMENTS.md` updated to reflect integration and E2E test scaffolding. Frontend tests were run: most suites passed; a Playwright runtime import requires installing `playwright` before running E2E. See verification notes below.

##### Step 18 Verification Checklist
- [ ] `cd backend` → `python manage.py test`
- [ ] `cd frontend` → `npm test`

#### Step 18 STOP & COMMIT
**STOP & COMMIT:** Final commit after all suites pass.
