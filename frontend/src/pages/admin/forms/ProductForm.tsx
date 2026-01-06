import { useEffect, useMemo, useState } from 'react'
import { adminCreate, adminList, adminPatch } from '../../../api/adminCrud'

type Category = { id: number; name: string; slug: string }
type Brand = { id: number; name: string; slug: string }

type Product = {
  id?: number
  name: string
  slug?: string
  description: string
  short_description?: string
  category: number
  brand: number | null
  sku: string
  price: string
  compare_price?: string | null
  stock: number
  is_active: boolean
  is_featured: boolean
}

function slugifyLite(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function ProductForm({
  apiPath,
  initial,
  onDone,
}: {
  apiPath: string
  initial?: any
  onDone: () => void
}) {
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])

  const [name, setName] = useState(String(initial?.name ?? ''))
  const [slug, setSlug] = useState(String(initial?.slug ?? ''))
  const [sku, setSku] = useState(String(initial?.sku ?? ''))
  const [price, setPrice] = useState(String(initial?.price ?? ''))
  const [stock, setStock] = useState(String(initial?.stock ?? '0'))
  const [description, setDescription] = useState(String(initial?.description ?? ''))
  const [categoryId, setCategoryId] = useState<number | ''>(initial?.category ?? '')
  const [brandId, setBrandId] = useState<number | ''>(initial?.brand ?? '')
  const [isActive, setIsActive] = useState(Boolean(initial?.is_active ?? true))
  const [isFeatured, setIsFeatured] = useState(Boolean(initial?.is_featured ?? false))

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [cats, brs] = await Promise.all([
          adminList<Category>('/api/v1/admin/products/categories/'),
          adminList<Brand>('/api/v1/admin/products/brands/'),
        ])
        if (cancelled) return
        setCategories(cats.results)
        setBrands(brs.results)
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Failed to load categories/brands.')
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const canSubmit = useMemo(() => {
    return (
      name.trim().length > 0 &&
      sku.trim().length > 0 &&
      price.trim().length > 0 &&
      description.trim().length > 0 &&
      categoryId !== ''
    )
  }, [name, sku, price, description, categoryId])

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        if (!canSubmit) return

        try {
          setLoading(true)
          setError(null)

          const payload: Product = {
            name,
            slug: slug.trim() || slugifyLite(name),
            description,
            short_description: description.slice(0, 300),
            category: Number(categoryId),
            brand: brandId === '' ? null : Number(brandId),
            sku,
            price,
            stock: Number(stock || '0'),
            is_active: isActive,
            is_featured: isFeatured,
          }

          if (initial?.id) {
            await adminPatch(apiPath, initial.id, payload)
          } else {
            await adminCreate(apiPath, payload)
          }

          onDone()
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Save failed')
        } finally {
          setLoading(false)
        }
      }}
      className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
    >
      {error ? <div className="text-sm text-rose-700 dark:text-rose-300">{error}</div> : null}

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Slug (optional)</label>
        <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder={slugifyLite(name)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">SKU</label>
          <input value={sku} onChange={(e) => setSku(e.target.value)} required />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Price</label>
          <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="19.99" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Stock</label>
          <input value={stock} onChange={(e) => setStock(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Category</label>
          <select
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
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
          value={brandId}
          onChange={(e) => setBrandId(e.target.value ? Number(e.target.value) : '')}
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
          className="min-h-[120px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Active
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
          Featured
        </label>
      </div>

      <button
        type="submit"
        disabled={loading || !canSubmit}
        className="h-10 bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-60"
      >
        {loading ? 'Saving…' : initial?.id ? 'Save product' : 'Create product'}
      </button>
    </form>
  )
}
