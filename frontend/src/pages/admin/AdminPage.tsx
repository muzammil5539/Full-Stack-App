import { useEffect, useMemo, useState } from 'react'
import AdminRequired from '../../admin/AdminRequired'
import {
  createBrand,
  createCategory,
  createProduct,
  listPublicBrands,
  listPublicCategories,
  type Brand,
  type Category,
} from '../../api/adminProducts'

function uiAdminLink(path: string): string {
  return path.startsWith('/') ? path : `/${path}`
}

function slugifyLite(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

type Flash = { kind: 'success' | 'error'; message: string }

export default function AdminPage() {
  return (
    <AdminRequired>
      <AdminDashboard />
    </AdminRequired>
  )
}

function AdminDashboard() {

  const [flash, setFlash] = useState<Flash | null>(null)
  const [busy, setBusy] = useState(false)

  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])

  const [categoryName, setCategoryName] = useState('')
  const [categorySlug, setCategorySlug] = useState('')
  const [categoryDescription, setCategoryDescription] = useState('')

  const [brandName, setBrandName] = useState('')
  const [brandSlug, setBrandSlug] = useState('')
  const [brandDescription, setBrandDescription] = useState('')

  const [productName, setProductName] = useState('')
  const [productSlug, setProductSlug] = useState('')
  const [productSku, setProductSku] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [productStock, setProductStock] = useState('0')
  const [productDescription, setProductDescription] = useState('')
  const [productCategoryId, setProductCategoryId] = useState<number | ''>('')
  const [productBrandId, setProductBrandId] = useState<number | ''>('')
  const [productIsActive, setProductIsActive] = useState(true)
  const [productIsFeatured, setProductIsFeatured] = useState(false)

  const canSubmitProduct = useMemo(() => {
    return (
      productName.trim().length > 0 &&
      productSku.trim().length > 0 &&
      productPrice.trim().length > 0 &&
      productDescription.trim().length > 0 &&
      productCategoryId !== ''
    )
  }, [productName, productSku, productPrice, productDescription, productCategoryId])

  useEffect(() => {

    let cancelled = false
    async function load() {
      try {
        const [cats, brs] = await Promise.all([listPublicCategories(), listPublicBrands()])
        if (cancelled) return
        setCategories(cats.results)
        setBrands(brs.results)
      } catch (e) {
        if (cancelled) return
        setFlash({ kind: 'error', message: e instanceof Error ? e.message : 'Failed to load categories/brands.' })
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault()
    setFlash(null)
    setBusy(true)
    try {
      const created = await createCategory({
        name: categoryName,
        slug: categorySlug.trim() || slugifyLite(categoryName),
        description: categoryDescription,
        is_active: true,
      })
      setFlash({ kind: 'success', message: `Category created: ${created.name}` })
      setCategoryName('')
      setCategorySlug('')
      setCategoryDescription('')
      const cats = await listPublicCategories()
      setCategories(cats.results)
    } catch (err: any) {
      const msg = err?.status === 403 ? 'Forbidden: your user is not an admin.' : err?.message || 'Failed to create category.'
      setFlash({ kind: 'error', message: msg })
    } finally {
      setBusy(false)
    }
  }

  async function handleCreateBrand(e: React.FormEvent) {
    e.preventDefault()
    setFlash(null)
    setBusy(true)
    try {
      const created = await createBrand({
        name: brandName,
        slug: brandSlug.trim() || slugifyLite(brandName),
        description: brandDescription,
        is_active: true,
      })
      setFlash({ kind: 'success', message: `Brand created: ${created.name}` })
      setBrandName('')
      setBrandSlug('')
      setBrandDescription('')
      const brs = await listPublicBrands()
      setBrands(brs.results)
    } catch (err: any) {
      const msg = err?.status === 403 ? 'Forbidden: your user is not an admin.' : err?.message || 'Failed to create brand.'
      setFlash({ kind: 'error', message: msg })
    } finally {
      setBusy(false)
    }
  }

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmitProduct) return

    setFlash(null)
    setBusy(true)
    try {
      const created = await createProduct({
        name: productName,
        slug: productSlug.trim() || slugifyLite(productName),
        description: productDescription,
        short_description: productDescription.slice(0, 300),
        category: Number(productCategoryId),
        brand: productBrandId === '' ? null : Number(productBrandId),
        sku: productSku,
        price: productPrice,
        stock: Number(productStock || '0'),
        is_active: productIsActive,
        is_featured: productIsFeatured,
      })

      setFlash({ kind: 'success', message: `Product created: ${created.name}` })
      setProductName('')
      setProductSlug('')
      setProductSku('')
      setProductPrice('')
      setProductStock('0')
      setProductDescription('')
      setProductCategoryId('')
      setProductBrandId('')
      setProductIsActive(true)
      setProductIsFeatured(false)
    } catch (err: any) {
      const msg = err?.status === 403 ? 'Forbidden: your user is not an admin.' : err?.message || 'Failed to create product.'
      setFlash({ kind: 'error', message: msg })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1>Admin</h1>
          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Create Categories, Brands, and Products (admin users only).
          </div>
        </div>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
        <h2>Site administration</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          These links open the backend Django Admin where you can Add/Change everything.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
            <div className="text-sm font-semibold">Auth Token</div>
            <div className="mt-2 flex flex-wrap gap-3 text-sm">
              <a href={uiAdminLink('/admin/authtoken/token/add/')}>Add</a>
              <a href={uiAdminLink('/admin/authtoken/token/')}>Change</a>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
            <div className="text-sm font-semibold">Authentication and Authorization</div>
            <div className="mt-2 grid gap-2 text-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-slate-600 dark:text-slate-300">Groups</span>
                <a href={uiAdminLink('/admin/auth/group/add/')}>Add</a>
                <a href={uiAdminLink('/admin/auth/group/')}>Change</a>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
            <div className="text-sm font-semibold">Notifications</div>
            <div className="mt-2 flex flex-wrap gap-3 text-sm">
              <a href={uiAdminLink('/admin/notifications/notification/add/')}>Add</a>
              <a href={uiAdminLink('/admin/notifications/notification/')}>Change</a>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
            <div className="text-sm font-semibold">Orders</div>
            <div className="mt-2 grid gap-2 text-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-slate-600 dark:text-slate-300">Order Items</span>
                <a href={uiAdminLink('/admin/orders/orderitem/add/')}>Add</a>
                <a href={uiAdminLink('/admin/orders/orderitem/')}>Change</a>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-slate-600 dark:text-slate-300">Orders</span>
                <a href={uiAdminLink('/admin/orders/order/add/')}>Add</a>
                <a href={uiAdminLink('/admin/orders/order/')}>Change</a>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
            <div className="text-sm font-semibold">Payments</div>
            <div className="mt-2 flex flex-wrap gap-3 text-sm">
              <a href={uiAdminLink('/admin/payments/payment/add/')}>Add</a>
              <a href={uiAdminLink('/admin/payments/payment/')}>Change</a>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
            <div className="text-sm font-semibold">Products</div>
            <div className="mt-2 grid gap-2 text-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-slate-600 dark:text-slate-300">Brands</span>
                <a href={uiAdminLink('/admin/products/brand/add/')}>Add</a>
                <a href={uiAdminLink('/admin/products/brand/')}>Change</a>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-slate-600 dark:text-slate-300">Categories</span>
                <a href={uiAdminLink('/admin/products/category/add/')}>Add</a>
                <a href={uiAdminLink('/admin/products/category/')}>Change</a>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-slate-600 dark:text-slate-300">Product Images</span>
                <a href={uiAdminLink('/admin/products/productimage/add/')}>Add</a>
                <a href={uiAdminLink('/admin/products/productimage/')}>Change</a>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-slate-600 dark:text-slate-300">Products</span>
                <a href={uiAdminLink('/admin/products/product/add/')}>Add</a>
                <a href={uiAdminLink('/admin/products/product/')}>Change</a>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
            <div className="text-sm font-semibold">Reviews</div>
            <div className="mt-2 flex flex-wrap gap-3 text-sm">
              <a href={uiAdminLink('/admin/reviews/review/add/')}>Add</a>
              <a href={uiAdminLink('/admin/reviews/review/')}>Change</a>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
            <div className="text-sm font-semibold">Shopping Cart</div>
            <div className="mt-2 grid gap-2 text-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-slate-600 dark:text-slate-300">Cart Items</span>
                <a href={uiAdminLink('/admin/cart/cartitem/add/')}>Add</a>
                <a href={uiAdminLink('/admin/cart/cartitem/')}>Change</a>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-slate-600 dark:text-slate-300">Carts</span>
                <a href={uiAdminLink('/admin/cart/cart/add/')}>Add</a>
                <a href={uiAdminLink('/admin/cart/cart/')}>Change</a>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
            <div className="text-sm font-semibold">User Accounts</div>
            <div className="mt-2 grid gap-2 text-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-slate-600 dark:text-slate-300">Addresses</span>
                <a href={uiAdminLink('/admin/accounts/address/add/')}>Add</a>
                <a href={uiAdminLink('/admin/accounts/address/')}>Change</a>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-slate-600 dark:text-slate-300">User Profiles</span>
                <a href={uiAdminLink('/admin/accounts/userprofile/add/')}>Add</a>
                <a href={uiAdminLink('/admin/accounts/userprofile/')}>Change</a>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-slate-600 dark:text-slate-300">Users</span>
                <a href={uiAdminLink('/admin/accounts/user/add/')}>Add</a>
                <a href={uiAdminLink('/admin/accounts/user/')}>Change</a>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
            <div className="text-sm font-semibold">Wishlist</div>
            <div className="mt-2 grid gap-2 text-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-slate-600 dark:text-slate-300">Wishlist Items</span>
                <a href={uiAdminLink('/admin/wishlist/wishlistitem/add/')}>Add</a>
                <a href={uiAdminLink('/admin/wishlist/wishlistitem/')}>Change</a>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-slate-600 dark:text-slate-300">Wishlists</span>
                <a href={uiAdminLink('/admin/wishlist/wishlist/add/')}>Add</a>
                <a href={uiAdminLink('/admin/wishlist/wishlist/')}>Change</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {flash ? (
        <div
          className={[
            'rounded-md border px-4 py-3 text-sm',
            flash.kind === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-100'
              : 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-100',
          ].join(' ')}
        >
          {flash.message}
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-3">
        <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
          <h2>New Category</h2>
          <form onSubmit={handleCreateCategory} className="mt-3 grid gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Name</label>
              <input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Slug (optional)</label>
              <input value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)} placeholder={slugifyLite(categoryName)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Description</label>
              <input value={categoryDescription} onChange={(e) => setCategoryDescription(e.target.value)} placeholder="Optional" />
            </div>
            <button className="h-9 bg-sky-600 text-white hover:bg-sky-700" disabled={busy}>
              Add Category
            </button>
          </form>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
          <h2>New Brand</h2>
          <form onSubmit={handleCreateBrand} className="mt-3 grid gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Name</label>
              <input value={brandName} onChange={(e) => setBrandName(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Slug (optional)</label>
              <input value={brandSlug} onChange={(e) => setBrandSlug(e.target.value)} placeholder={slugifyLite(brandName)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Description</label>
              <input value={brandDescription} onChange={(e) => setBrandDescription(e.target.value)} placeholder="Optional" />
            </div>
            <button className="h-9 bg-sky-600 text-white hover:bg-sky-700" disabled={busy}>
              Add Brand
            </button>
          </form>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
          <h2>New Product</h2>
          <form onSubmit={handleCreateProduct} className="mt-3 grid gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Name</label>
              <input value={productName} onChange={(e) => setProductName(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Slug (optional)</label>
              <input value={productSlug} onChange={(e) => setProductSlug(e.target.value)} placeholder={slugifyLite(productName)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">SKU</label>
                <input value={productSku} onChange={(e) => setProductSku(e.target.value)} required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Price</label>
                <input value={productPrice} onChange={(e) => setProductPrice(e.target.value)} placeholder="19.99" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Stock</label>
                <input value={productStock} onChange={(e) => setProductStock(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Category</label>
                <select
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  value={productCategoryId}
                  onChange={(e) => setProductCategoryId(e.target.value ? Number(e.target.value) : '')}
                  required
                >
                  <option value="">Select…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Brand (optional)</label>
              <select
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                value={productBrandId}
                onChange={(e) => setProductBrandId(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">None</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Description</label>
              <textarea
                className="min-h-[92px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={productIsActive} onChange={(e) => setProductIsActive(e.target.checked)} />
                Active
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={productIsFeatured} onChange={(e) => setProductIsFeatured(e.target.checked)} />
                Featured
              </label>
            </div>

            <button
              className="h-9 bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-60"
              disabled={busy || !canSubmitProduct}
            >
              Add Product
            </button>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Note: if you get 403, make sure you logged in with a Django staff/superuser account.
            </p>
          </form>
        </section>
      </div>
    </div>
  )
}
