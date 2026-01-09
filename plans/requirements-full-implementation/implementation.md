# requirements-full-implementation — Step 1 Only

## Goal
Align documentation with the real Django/DRF routes + payloads, add requirement traceability, and remove stale “Starter page” copy from the functional login page.

## Prerequisites
- Be on branch: `feat/requirements-md-full-implementation`
- Ensure a clean working tree before starting.

# requirements-full-implementation — Steps 1–3

## Goal
Implement Steps 1–3 of the `REQUIREMENTS.md` plan:
1) docs alignment + traceability hygiene,
2) landing page with real storefront entry points,
3) products browse UI (search/sort/filter/pagination + improved cards).

## Prerequisites
- Be on branch: `feat/requirements-md-full-implementation`
- Ensure a clean working tree before starting.
- Backend venv ready: activate `backend/.venv`
- Frontend deps installed: `cd frontend` then `npm install`

---

## Step-by-Step Instructions

### Step 1: Docs alignment + traceability hygiene (commit 1)

#### 1.1 Verify traceability section exists (no-op if already present)
- [ ] Confirm `plans/requirements-full-implementation/plan.md` includes `## Traceability (REQUIREMENTS.md → Implementation Steps)`.

#### 1.2 Enable `page_size` for PageNumberPagination (align docs with real behavior)
`backend/docs/API.md` documents `page_size`, but DRF’s default `PageNumberPagination` does not honor `page_size` unless configured.

- [ ] Apply this diff:

```diff
diff --git a/backend/utils/pagination.py b/backend/utils/pagination.py
new file mode 100644
index 0000000..a62eb97
--- /dev/null
+++ b/backend/utils/pagination.py
@@
+from rest_framework.pagination import PageNumberPagination
+
+
+class StandardResultsSetPagination(PageNumberPagination):
+    page_size_query_param = "page_size"
+    max_page_size = 100

diff --git a/backend/settings/base.py b/backend/settings/base.py
index 1c8be63..a4c0d55 100644
--- a/backend/settings/base.py
+++ b/backend/settings/base.py
@@
 REST_FRAMEWORK = {
@@
-    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
+    'DEFAULT_PAGINATION_CLASS': 'utils.pagination.StandardResultsSetPagination',
     'PAGE_SIZE': 20,
@@
 }
```

#### 1.3 Align root README auth wording (DRF token auth, not JWT) and frontend HTTP library
- [ ] Apply this diff:

```diff
diff --git a/Readme.md b/Readme.md
index 84fc5e9..b1b3d9c 100644
--- a/Readme.md
+++ b/Readme.md
@@
 ### Backend Features
-✅ User authentication with JWT
+✅ User authentication with DRF TokenAuthentication
@@
 ### Frontend
 - React.js
 - Redux/Context API
- Axios
+ Fetch (via a lightweight wrapper in `frontend/src/api/http.ts`)
 - React Router
 - Material-UI / Tailwind CSS
```

#### 1.4 Keep `backend/docs/API.md` accurate for ordering fields
Backend supports ordering by `name`, `price`, and `created_at`.

- [ ] Apply this diff:

```diff
diff --git a/backend/docs/API.md b/backend/docs/API.md
index 9d586c6..fbedc8a 100644
--- a/backend/docs/API.md
+++ b/backend/docs/API.md
@@
 - `category`: Filter by category ID
 - `brand`: Filter by brand ID
 - `search`: Search in product name and description
- `ordering`: Sort by field (price, -price, created_at, -created_at)
+- `ordering`: Sort by field (name, -name, price, -price, created_at, -created_at)
 - `page`: Page number
 - `page_size`: Items per page
```

---

### Step 1 Verification Checklist
- [ ] Backend: `cd backend` then `python manage.py check`
- [ ] Run backend and confirm `page_size` is honored:
  - `python manage.py runserver`
  - `Invoke-RestMethod -Method Get -Uri "http://localhost:8000/api/v1/products/?page_size=1" | Select-Object -ExpandProperty results | Measure-Object`
- [ ] Confirm `Readme.md` no longer claims JWT.

---

### Step 1 STOP & COMMIT
**STOP & COMMIT:** Stop here and wait for the user to test, stage, and commit the change for Step 1.

---

### Step 2: Frontend landing page entry points (commit 2)

#### 2.1 Expand public storefront API helpers (products + categories + brands)
- [ ] Apply this diff:

```diff
diff --git a/frontend/src/api/products.ts b/frontend/src/api/products.ts
index c33206d..fbd2b25 100644
--- a/frontend/src/api/products.ts
+++ b/frontend/src/api/products.ts
@@
 type PaginatedResponse<T> = {
   count: number
   next: string | null
   previous: string | null
   results: T[]
 }
+
+export type Category = {
+  id: number
+  name: string
+  slug: string
+  description?: string
+  parent?: number | null
+  is_active: boolean
+}
+
+export type Brand = {
+  id: number
+  name: string
+  slug: string
+  description?: string
+  is_active: boolean
+}
@@
 export type Product = {
@@
+  is_featured?: boolean
   is_on_sale?: boolean
   discount_percentage?: number
@@
 }

+export type ProductListParams = {
+  page?: number
+  page_size?: number
+  search?: string
+  ordering?: string
+  category?: number
+  brand?: number
+  is_featured?: boolean
+}
+
+function buildQuery(params: ProductListParams | undefined): string {
+  if (!params) return ''
+  const searchParams = new URLSearchParams()
+
+  if (params.page) searchParams.set('page', String(params.page))
+  if (params.page_size) searchParams.set('page_size', String(params.page_size))
+  if (params.search) searchParams.set('search', params.search)
+  if (params.ordering) searchParams.set('ordering', params.ordering)
+  if (typeof params.category === 'number') searchParams.set('category', String(params.category))
+  if (typeof params.brand === 'number') searchParams.set('brand', String(params.brand))
+  if (typeof params.is_featured === 'boolean') searchParams.set('is_featured', String(params.is_featured))
+
+  const qs = searchParams.toString()
+  return qs ? `?${qs}` : ''
+}
+
-export async function listProducts(): Promise<PaginatedResponse<Product>> {
-  return getJson<PaginatedResponse<Product>>(`${API_BASE_URL}/api/v1/products/`)
-}
+export async function listProducts(params?: ProductListParams): Promise<PaginatedResponse<Product>> {
+  return getJson<PaginatedResponse<Product>>(`${API_BASE_URL}/api/v1/products/${buildQuery(params)}`)
+}
+
+export async function listCategories(): Promise<PaginatedResponse<Category>> {
+  return getJson<PaginatedResponse<Category>>(`${API_BASE_URL}/api/v1/products/categories/`)
+}
+
+export async function listBrands(): Promise<PaginatedResponse<Brand>> {
+  return getJson<PaginatedResponse<Brand>>(`${API_BASE_URL}/api/v1/products/brands/`)
+}
```

#### 2.2 Add featured products + category/brand chips to the landing page
- [ ] Apply this diff:

```diff
diff --git a/frontend/src/pages/HomePage.tsx b/frontend/src/pages/HomePage.tsx
index e52e1fa..f11a5fa 100644
--- a/frontend/src/pages/HomePage.tsx
+++ b/frontend/src/pages/HomePage.tsx
@@
-import { Link } from 'react-router-dom'
+import { useEffect, useState } from 'react'
+import { Link } from 'react-router-dom'
+import { listBrands, listCategories, listProducts, type Brand, type Category, type Product } from '../api/products'
+import ErrorMessage from '../shared/ui/ErrorMessage'
+import Loading from '../shared/ui/Loading'
@@
 export default function HomePage() {
+  const [featured, setFeatured] = useState<Product[]>([])
+  const [categories, setCategories] = useState<Category[]>([])
+  const [brands, setBrands] = useState<Brand[]>([])
+  const [loading, setLoading] = useState(true)
+  const [error, setError] = useState<string | null>(null)
+
+  useEffect(() => {
+    let cancelled = false
+
+    async function load() {
+      try {
+        setLoading(true)
+        setError(null)
+
+        const [productsRes, categoriesRes, brandsRes] = await Promise.all([
+          listProducts({ is_featured: true, page: 1, page_size: 8 }),
+          listCategories(),
+          listBrands(),
+        ])
+
+        if (cancelled) return
+
+        setFeatured(productsRes.results.slice(0, 4))
+        setCategories(categoriesRes.results.slice(0, 6))
+        setBrands(brandsRes.results.slice(0, 6))
+      } catch (e) {
+        const message = e instanceof Error ? e.message : 'Failed to load storefront data'
+        if (!cancelled) setError(message)
+      } finally {
+        if (!cancelled) setLoading(false)
+      }
+    }
+
+    void load()
+    return () => {
+      cancelled = true
+    }
+  }, [])
+
   return (
     <div className="grid gap-8">
@@
       <section className="grid gap-4">
@@
       </section>
+
+      <section className="grid gap-4">
+        <div className="flex items-end justify-between gap-3">
+          <div className="grid gap-1">
+            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Featured products</h2>
+            <p className="text-sm text-slate-600 dark:text-slate-300">A quick look at what’s new and popular.</p>
+          </div>
+          <Link
+            to="/products"
+            className="text-sm font-semibold text-sky-700 hover:text-sky-800 dark:text-sky-200 dark:hover:text-sky-100"
+          >
+            Browse all
+          </Link>
+        </div>
+
+        {loading ? <Loading label="Loading featured products…" /> : null}
+        {error ? <ErrorMessage message={error} /> : null}
+
+        {!loading && !error ? (
+          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
+            {featured.map((p) => {
+              const primaryImage = p.images?.find((img) => img.is_primary) ?? p.images?.[0]
+              return (
+                <Link
+                  key={p.id}
+                  to={`/products/${p.slug}`}
+                  className="group grid gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
+                >
+                  <div className="aspect-[4/3] overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
+                    {primaryImage ? (
+                      <img
+                        src={primaryImage.image}
+                        alt={primaryImage.alt_text || p.name}
+                        className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]"
+                      />
+                    ) : (
+                      <div className="flex h-full w-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
+                        No image
+                      </div>
+                    )}
+                  </div>
+
+                  <div className="grid gap-1">
+                    <div className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-slate-50">{p.name}</div>
+                    <div className="flex flex-wrap items-baseline gap-2">
+                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">${p.price}</span>
+                      {p.compare_price && Number(p.compare_price) > Number(p.price) ? (
+                        <span className="text-xs text-slate-500 line-through dark:text-slate-400">${p.compare_price}</span>
+                      ) : null}
+                      {p.is_on_sale && p.discount_percentage ? (
+                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 ring-1 ring-red-200 dark:bg-red-900/40 dark:text-red-100 dark:ring-red-800">
+                          {p.discount_percentage}% OFF
+                        </span>
+                      ) : null}
+                    </div>
+                    <div className="text-xs text-slate-500 dark:text-slate-400">{p.category_name ?? ' '}</div>
+                  </div>
+                </Link>
+              )
+            })}
+          </div>
+        ) : null}
+      </section>
+
+      <section className="grid gap-4">
+        <div className="grid gap-1">
+          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Shop by</h2>
+          <p className="text-sm text-slate-600 dark:text-slate-300">Jump straight into a category or brand.</p>
+        </div>
+
+        <div className="grid gap-4 md:grid-cols-2">
+          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
+            <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-50">Categories</div>
+            <div className="flex flex-wrap gap-2">
+              {categories.map((c) => (
+                <Link
+                  key={c.id}
+                  to={`/products?category=${c.id}`}
+                  className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
+                >
+                  {c.name}
+                </Link>
+              ))}
+              {categories.length === 0 && !loading ? (
+                <span className="text-sm text-slate-600 dark:text-slate-300">No categories yet.</span>
+              ) : null}
+            </div>
+          </div>
+
+          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
+            <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-50">Brands</div>
+            <div className="flex flex-wrap gap-2">
+              {brands.map((b) => (
+                <Link
+                  key={b.id}
+                  to={`/products?brand=${b.id}`}
+                  className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
+                >
+                  {b.name}
+                </Link>
+              ))}
+              {brands.length === 0 && !loading ? (
+                <span className="text-sm text-slate-600 dark:text-slate-300">No brands yet.</span>
+              ) : null}
+            </div>
+          </div>
+        </div>
+      </section>
     </div>
   )
 }
```

#### 2.3 Update the HomePage smoke test to mock API calls
- [ ] Apply this diff:

```diff
diff --git a/frontend/src/pages/HomePage.test.tsx b/frontend/src/pages/HomePage.test.tsx
index 73d1c7b..8ac210f 100644
--- a/frontend/src/pages/HomePage.test.tsx
+++ b/frontend/src/pages/HomePage.test.tsx
@@
 import { render, screen } from '@testing-library/react'
 import { MemoryRouter } from 'react-router-dom'
-import { describe, expect, it } from 'vitest'
+import { describe, expect, it, vi } from 'vitest'
+
+vi.mock('../api/products', () => {
+  return {
+    listProducts: () => Promise.resolve({ count: 0, next: null, previous: null, results: [] }),
+    listCategories: () => Promise.resolve({ count: 0, next: null, previous: null, results: [] }),
+    listBrands: () => Promise.resolve({ count: 0, next: null, previous: null, results: [] }),
+  }
+})
 
 import HomePage from './HomePage'
```

---

### Step 2 Verification Checklist
- [ ] Frontend: `cd frontend` then `npm run lint`
- [ ] Frontend tests: `npm run test:ci`
- [ ] Manual: `npm run dev` then open `/` and confirm:
  - Featured section renders (or shows loading/error)
  - Category/brand chips navigate to `/products?category=...` and `/products?brand=...`

---

### Step 2 STOP & COMMIT
**STOP & COMMIT:** Stop here and wait for the user to test, stage, and commit the change for Step 2.

---

### Step 3: Products browse UI (search/sort/filter/pagination + improved cards) (commit 3)

#### 3.1 Upgrade `useProducts` to accept params and return the paginated response
- [ ] Apply this diff:

```diff
diff --git a/frontend/src/features/products/hooks/useProducts.ts b/frontend/src/features/products/hooks/useProducts.ts
index 66c2408..b247c56 100644
--- a/frontend/src/features/products/hooks/useProducts.ts
+++ b/frontend/src/features/products/hooks/useProducts.ts
@@
-import { useEffect, useState } from 'react'
-import { listProducts, type Product } from '../../../api/products'
+import { useEffect, useMemo, useState } from 'react'
+import { listProducts, type Product, type ProductListParams } from '../../../api/products'
@@
 type State = {
-  products: Product[]
+  response: { count: number; next: string | null; previous: string | null; results: Product[] } | null
   loading: boolean
   error: string | null
 }
 
-export function useProducts(): State {
+export function useProducts(params: ProductListParams): State {
   const [state, setState] = useState<State>({
-    products: [],
+    response: null,
     loading: true,
     error: null,
   })
+
+  const stableParams = useMemo(() => params, [
+    params.page,
+    params.page_size,
+    params.search,
+    params.ordering,
+    params.category,
+    params.brand,
+    params.is_featured,
+  ])
@@
     async function load() {
       try {
         setState((s) => ({ ...s, loading: true, error: null }))
-        const response = await listProducts()
+        const response = await listProducts(stableParams)
         if (!cancelled) {
-          setState({ products: response.results, loading: false, error: null })
+          setState({ response, loading: false, error: null })
         }
       } catch (e) {
         const message = e instanceof Error ? e.message : 'Failed to load products'
         if (!cancelled) {
-          setState({ products: [], loading: false, error: message })
+          setState({ response: null, loading: false, error: message })
         }
       }
     }
@@
-  }, [])
+  }, [stableParams])
 
   return state
 }
```

#### 3.2 Replace product list UI with browse controls + better cards
- [ ] Apply this diff:

```diff
diff --git a/frontend/src/features/products/components/ProductList.tsx b/frontend/src/features/products/components/ProductList.tsx
index 5c7774c..fa3df5f 100644
--- a/frontend/src/features/products/components/ProductList.tsx
+++ b/frontend/src/features/products/components/ProductList.tsx
@@
-import { useState } from 'react'
-import { Link } from 'react-router-dom'
+import { useEffect, useMemo, useState } from 'react'
+import { Link, useSearchParams } from 'react-router-dom'
 import { addCartItem } from '../../../api/cart'
+import { listBrands, listCategories, type Brand, type Category } from '../../../api/products'
 import { addWishlistItem } from '../../../api/wishlist'
 import { useAuthToken } from '../../../auth/useAuthToken'
 import ErrorMessage from '../../../shared/ui/ErrorMessage'
 import Loading from '../../../shared/ui/Loading'
 import { useProducts } from '../hooks/useProducts'
@@
 export default function ProductList() {
-  const { products, loading, error } = useProducts()
+  const [searchParams, setSearchParams] = useSearchParams()
+
+  const page = Number(searchParams.get('page') ?? '1') || 1
+  const ordering = searchParams.get('ordering') ?? '-created_at'
+  const search = searchParams.get('search') ?? ''
+  const category = searchParams.get('category') ? Number(searchParams.get('category')) : undefined
+  const brand = searchParams.get('brand') ? Number(searchParams.get('brand')) : undefined
+
+  const params = useMemo(
+    () => ({ page, ordering, search: search || undefined, category, brand }),
+    [page, ordering, search, category, brand]
+  )
+
+  const { response, loading, error } = useProducts(params)
   const { isAuthenticated } = useAuthToken()
@@
+  const [filtersLoading, setFiltersLoading] = useState(true)
+  const [filtersError, setFiltersError] = useState<string | null>(null)
+  const [categories, setCategories] = useState<Category[]>([])
+  const [brands, setBrands] = useState<Brand[]>([])
+
+  const [searchDraft, setSearchDraft] = useState(search)
+
+  useEffect(() => {
+    setSearchDraft(search)
+  }, [search])
+
+  useEffect(() => {
+    let cancelled = false
+
+    async function loadFilters() {
+      try {
+        setFiltersLoading(true)
+        setFiltersError(null)
+        const [cats, brs] = await Promise.all([listCategories(), listBrands()])
+        if (cancelled) return
+        setCategories(cats.results)
+        setBrands(brs.results)
+      } catch (e) {
+        const message = e instanceof Error ? e.message : 'Failed to load filters'
+        if (!cancelled) setFiltersError(message)
+      } finally {
+        if (!cancelled) setFiltersLoading(false)
+      }
+    }
+
+    void loadFilters()
+    return () => {
+      cancelled = true
+    }
+  }, [])
+
+  const products = response?.results ?? []
+  const hasPrev = Boolean(response?.previous)
+  const hasNext = Boolean(response?.next)
+
+  function updateParam(next: Record<string, string | null>) {
+    const updated = new URLSearchParams(searchParams)
+    for (const [key, value] of Object.entries(next)) {
+      if (!value) updated.delete(key)
+      else updated.set(key, value)
+    }
+    if ('search' in next || 'ordering' in next || 'category' in next || 'brand' in next) {
+      updated.delete('page')
+    }
+    setSearchParams(updated)
+  }
@@
-  if (loading) return <Loading label="Loading products…" />
-  if (error) return <ErrorMessage message={error} />
-
-  if (products.length === 0) {
-    return <p className="m-0 text-sm text-slate-600 dark:text-slate-300">No products yet.</p>
-  }
+  // render below (loading/error handled inline)
@@
-  return (
-    <div className="grid gap-3">
-      {products.map((p) => (
-        <div
-          key={p.id}
-          className="grid gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950"
-        >
-          <div className="flex items-start justify-between gap-3">
-            <strong className="text-sm font-semibold">{p.name}</strong>
-            <span className="text-sm font-semibold">{p.price}</span>
-          </div>
-          <div className="text-xs text-slate-500 dark:text-slate-400">Stock: {p.stock}</div>
-          <div className="flex flex-wrap items-center gap-2">
-            <Link to={`/products/${p.slug}`} className={[linkBase, 'text-sm'].join(' ')}>
-              View
-            </Link>
-            <button
-              disabled={!isAuthenticated || Boolean(cartPending[p.id])}
-              onClick={async () => {
-                if (cartPending[p.id]) return
-                try {
-                  setCartPending((prev) => ({ ...prev, [p.id]: true }))
-                  await addCartItem({ product: p.id, quantity: 1 })
-                } finally {
-                  setCartPending((prev) => {
-                    const next = { ...prev }
-                    delete next[p.id]
-                    return next
-                  })
-                }
-              }}
-              className={[buttonBase, 'h-9'].join(' ')}
-            >
-              {cartPending[p.id] ? 'Adding…' : 'Add to cart'}
-            </button>
-            <button
-              disabled={!isAuthenticated || Boolean(wishlistPending[p.id])}
-              onClick={async () => {
-                if (wishlistPending[p.id]) return
-                try {
-                  setWishlistPending((prev) => ({ ...prev, [p.id]: true }))
-                  await addWishlistItem(p.id)
-                } finally {
-                  setWishlistPending((prev) => {
-                    const next = { ...prev }
-                    delete next[p.id]
-                    return next
-                  })
-                }
-              }}
-              className={[buttonBase, 'h-9'].join(' ')}
-            >
-              {wishlistPending[p.id] ? 'Saving…' : 'Wishlist'}
-            </button>
-            {!isAuthenticated && <span className="text-xs text-slate-500 dark:text-slate-400">Login to buy</span>}
-          </div>
-        </div>
-      ))}
-    </div>
-  )
+  return (
+    <div className="grid gap-4">
+      <form
+        onSubmit={(e) => {
+          e.preventDefault()
+          updateParam({ search: searchDraft.trim() || null })
+        }}
+        className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-12 md:items-end dark:border-slate-800 dark:bg-slate-950"
+      >
+        <label className="grid gap-1 md:col-span-5">
+          <span className="text-sm font-medium">Search</span>
+          <input
+            value={searchDraft}
+            onChange={(e) => setSearchDraft(e.target.value)}
+            placeholder="Search products…"
+            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
+          />
+        </label>
+
+        <label className="grid gap-1 md:col-span-3">
+          <span className="text-sm font-medium">Sort</span>
+          <select
+            value={ordering}
+            onChange={(e) => updateParam({ ordering: e.target.value || null })}
+            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
+          >
+            <option value="-created_at">Newest</option>
+            <option value="created_at">Oldest</option>
+            <option value="name">Name (A → Z)</option>
+            <option value="-name">Name (Z → A)</option>
+            <option value="price">Price (Low → High)</option>
+            <option value="-price">Price (High → Low)</option>
+          </select>
+        </label>
+
+        <label className="grid gap-1 md:col-span-2">
+          <span className="text-sm font-medium">Category</span>
+          <select
+            value={category ? String(category) : ''}
+            onChange={(e) => updateParam({ category: e.target.value || null })}
+            disabled={filtersLoading}
+            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
+          >
+            <option value="">All</option>
+            {categories.map((c) => (
+              <option key={c.id} value={String(c.id)}>
+                {c.name}
+              </option>
+            ))}
+          </select>
+        </label>
+
+        <label className="grid gap-1 md:col-span-2">
+          <span className="text-sm font-medium">Brand</span>
+          <select
+            value={brand ? String(brand) : ''}
+            onChange={(e) => updateParam({ brand: e.target.value || null })}
+            disabled={filtersLoading}
+            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
+          >
+            <option value="">All</option>
+            {brands.map((b) => (
+              <option key={b.id} value={String(b.id)}>
+                {b.name}
+              </option>
+            ))}
+          </select>
+        </label>
+
+        <div className="flex flex-wrap gap-2 md:col-span-12">
+          <button type="submit" className={[buttonBase, 'h-9'].join(' ')}>
+            Apply
+          </button>
+          <button
+            type="button"
+            className={[buttonBase, 'h-9'].join(' ')}
+            onClick={() => {
+              setSearchDraft('')
+              setSearchParams(new URLSearchParams())
+            }}
+          >
+            Reset
+          </button>
+          {filtersError ? <span className="text-xs text-rose-700 dark:text-rose-200">{filtersError}</span> : null}
+        </div>
+      </form>
+
+      {loading ? <Loading label="Loading products…" /> : null}
+      {error ? <ErrorMessage message={error} /> : null}
+
+      {!loading && !error && products.length === 0 ? (
+        <p className="m-0 text-sm text-slate-600 dark:text-slate-300">No products found.</p>
+      ) : null}
+
+      {!loading && !error && products.length > 0 ? (
+        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
+          {products.map((p) => {
+            const primaryImage = p.images?.find((img) => img.is_primary) ?? p.images?.[0]
+            return (
+              <div
+                key={p.id}
+                className="group grid gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
+              >
+                <Link
+                  to={`/products/${p.slug}`}
+                  className="aspect-[4/3] overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
+                >
+                  {primaryImage ? (
+                    <img
+                      src={primaryImage.image}
+                      alt={primaryImage.alt_text || p.name}
+                      className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]"
+                    />
+                  ) : (
+                    <div className="flex h-full w-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
+                      No image
+                    </div>
+                  )}
+                </Link>
+
+                <div className="grid gap-1">
+                  <div className="flex items-start justify-between gap-3">
+                    <Link to={`/products/${p.slug}`} className="text-sm font-semibold text-slate-900 hover:underline dark:text-slate-50">
+                      {p.name}
+                    </Link>
+                    {p.is_on_sale && p.discount_percentage ? (
+                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 ring-1 ring-red-200 dark:bg-red-900/40 dark:text-red-100 dark:ring-red-800">
+                        {p.discount_percentage}% OFF
+                      </span>
+                    ) : null}
+                  </div>
+
+                  <div className="flex flex-wrap items-baseline gap-2">
+                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">${p.price}</span>
+                    {p.compare_price && Number(p.compare_price) > Number(p.price) ? (
+                      <span className="text-xs text-slate-500 line-through dark:text-slate-400">${p.compare_price}</span>
+                    ) : null}
+                  </div>
+
+                  <div className="text-xs text-slate-500 dark:text-slate-400">
+                    {p.brand_name ? `${p.brand_name} • ` : ''}
+                    {p.category_name ?? ' '}
+                  </div>
+                </div>
+
+                <div className="flex flex-wrap items-center gap-2">
+                  <button
+                    disabled={!isAuthenticated || Boolean(cartPending[p.id])}
+                    onClick={async () => {
+                      if (cartPending[p.id]) return
+                      try {
+                        setCartPending((prev) => ({ ...prev, [p.id]: true }))
+                        await addCartItem({ product: p.id, quantity: 1 })
+                      } finally {
+                        setCartPending((prev) => {
+                          const next = { ...prev }
+                          delete next[p.id]
+                          return next
+                        })
+                      }
+                    }}
+                    className={[buttonBase, 'h-9'].join(' ')}
+                  >
+                    {cartPending[p.id] ? 'Adding…' : 'Add to cart'}
+                  </button>
+                  <button
+                    disabled={!isAuthenticated || Boolean(wishlistPending[p.id])}
+                    onClick={async () => {
+                      if (wishlistPending[p.id]) return
+                      try {
+                        setWishlistPending((prev) => ({ ...prev, [p.id]: true }))
+                        await addWishlistItem(p.id)
+                      } finally {
+                        setWishlistPending((prev) => {
+                          const next = { ...prev }
+                          delete next[p.id]
+                          return next
+                        })
+                      }
+                    }}
+                    className={[buttonBase, 'h-9'].join(' ')}
+                  >
+                    {wishlistPending[p.id] ? 'Saving…' : 'Wishlist'}
+                  </button>
+                  {!isAuthenticated ? <span className="text-xs text-slate-500 dark:text-slate-400">Login to buy</span> : null}
+                </div>
+              </div>
+            )
+          })}
+        </div>
+      ) : null}
+
+      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950">
+        <div className="text-sm text-slate-600 dark:text-slate-300">Page {page}</div>
+        <div className="flex items-center gap-2">
+          <button
+            className={[buttonBase, 'h-9'].join(' ')}
+            disabled={!hasPrev}
+            onClick={() => updateParam({ page: String(Math.max(1, page - 1)) })}
+          >
+            Previous
+          </button>
+          <button
+            className={[buttonBase, 'h-9'].join(' ')}
+            disabled={!hasNext}
+            onClick={() => updateParam({ page: String(page + 1) })}
+          >
+            Next
+          </button>
+        </div>
+      </div>
+    </div>
+  )
 }
```

#### 3.3 Add integration-style tests (mocked API)
- [ ] Apply this diff:

```diff
diff --git a/frontend/src/features/products/components/ProductList.test.tsx b/frontend/src/features/products/components/ProductList.test.tsx
new file mode 100644
index 0000000..a7c5cfb
--- /dev/null
+++ b/frontend/src/features/products/components/ProductList.test.tsx
@@
+import { render, screen } from '@testing-library/react'
+import userEvent from '@testing-library/user-event'
+import { MemoryRouter } from 'react-router-dom'
+import { describe, expect, it, vi } from 'vitest'
+import ProductList from './ProductList'
+
+const listProducts = vi.fn(async () => ({
+  count: 2,
+  next: 'http://localhost:8000/api/v1/products/?page=3',
+  previous: 'http://localhost:8000/api/v1/products/?page=1',
+  results: [
+    {
+      id: 1,
+      name: 'Test Product',
+      slug: 'test-product',
+      price: '10.00',
+      stock: 3,
+      category_name: 'Cat',
+      brand_name: 'Brand',
+      images: [],
+      is_on_sale: true,
+      discount_percentage: 10,
+      compare_price: '12.00',
+    },
+  ],
+}))
+
+vi.mock('../../../api/products', async () => {
+  const actual = (await vi.importActual('../../../api/products')) as Record<string, unknown>
+  return {
+    ...actual,
+    listProducts,
+    listCategories: () => Promise.resolve({ count: 0, next: null, previous: null, results: [] }),
+    listBrands: () => Promise.resolve({ count: 0, next: null, previous: null, results: [] }),
+  }
+})
+
+vi.mock('../../../api/cart', () => ({
+  addCartItem: () => Promise.resolve({}),
+}))
+
+vi.mock('../../../api/wishlist', () => ({
+  addWishlistItem: () => Promise.resolve({}),
+}))
+
+vi.mock('../../../auth/useAuthToken', () => ({
+  useAuthToken: () => ({ isAuthenticated: false }),
+}))
+
+describe('ProductList (browse)', () => {
+  it('calls listProducts using URL query params and paginates', async () => {
+    const user = userEvent.setup()
+
+    render(
+      <MemoryRouter initialEntries={['/products?search=shoe&ordering=price&category=1&brand=2&page=2']}>
+        <ProductList />
+      </MemoryRouter>
+    )
+
+    await screen.findByText(/test product/i)
+
+    expect(listProducts).toHaveBeenCalledWith(
+      expect.objectContaining({
+        page: 2,
+        ordering: 'price',
+        search: 'shoe',
+        category: 1,
+        brand: 2,
+      })
+    )
+
+    await user.click(screen.getByRole('button', { name: /next/i }))
+
+    expect(listProducts).toHaveBeenCalledWith(
+      expect.objectContaining({
+        page: 3,
+      })
+    )
+  })
+})
```

---

### Step 3 Verification Checklist
- [ ] Frontend: `cd frontend` then `npm run lint`
- [ ] Frontend tests: `npm run test:ci`
- [ ] Manual: open `/products` and verify:
  - Search updates URL `?search=`
  - Sort updates URL `?ordering=`
  - Category/brand filters update URL and reset to page 1
  - Previous/Next update `?page=` and disable appropriately
  - Cards show image/price/compare price/sale badge

---

### Step 3 STOP & COMMIT
**STOP & COMMIT:** Stop here and wait for the user to test, stage, and commit the change for Step 3.
       <h1 className="text-2xl font-semibold tracking-tight">Login</h1>
       <p className="text-sm text-slate-600 dark:text-slate-300">
-        Starter page: connect to backend auth endpoint (JWT/session) and store tokens.
+        Sign in to continue.
       </p>
*** End Patch
```

---

### Step 1 Verification Checklist

#### Docs correctness
- [ ] Confirm the token endpoint exists in Django routes:
  - `backend/config/urls.py` includes `path('api/v1/accounts/', include('apps.accounts.urls'))`
  - `backend/apps/accounts/urls.py` includes `path('token/', …)`
- [ ] Confirm `backend/docs/API.md` no longer references `/api/v1/auth/login/`.

#### “Starter page” copy removed
- [ ] Confirm “Starter page” no longer exists in frontend source:
  - `git grep -n "Starter page" frontend/src`

#### Basic sanity checks
- [ ] Backend: `cd backend` then `python manage.py check`
- [ ] Frontend: `cd frontend` then `npm run lint`

#### Optional functional verification (recommended)
- [ ] Start backend: `cd backend` then `python manage.py runserver`
- [ ] Obtain a token (PowerShell example; use a valid username/email + password):
  - `Invoke-RestMethod -Method Post -Uri http://localhost:8000/api/v1/accounts/token/ -ContentType 'application/json' -Body '{"username":"user@example.com","password":"password123"}'`
- [ ] Start frontend: `cd frontend` then `npm run dev` and verify the login page no longer shows “Starter page” copy.

---

### Step 1 STOP & COMMIT
**STOP & COMMIT:** Stop here and wait for the user to test, stage, and commit the change for Step 1.
