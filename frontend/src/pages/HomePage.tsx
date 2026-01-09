import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listBrands, listCategories, listProducts, type Brand, type Category, type Product } from '../api/products'
import ErrorMessage from '../shared/ui/ErrorMessage'
import Loading from '../shared/ui/Loading'

const linkBase = 'text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300'

function productImageUrl(p: Product): string | null {
  const primary = p.images?.find((img) => img.is_primary) ?? p.images?.[0]
  return primary?.image_url ?? primary?.image ?? null
}

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [pRes, cRes, bRes] = await Promise.all([
          listProducts({ is_featured: true, page_size: 8 }),
          listCategories({ page_size: 20 }),
          listBrands({ page_size: 20 }),
        ])
        if (cancelled) return
        setFeatured(pRes.results)
        setCategories(cRes.results)
        setBrands(bRes.results)
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : String(err)
        setError(message ?? 'Failed to load storefront data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <Loading />
  if (error) return <ErrorMessage message={error} />

  return (
    <div className="grid gap-8">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-amber-50 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-sky-950/30">
        <div className="grid items-center gap-6 md:grid-cols-[1.3fr_1fr]">
          <div className="grid gap-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-200 shadow-sm dark:bg-slate-900/60 dark:text-sky-200 dark:ring-slate-700">
              New season drop
            </div>
            <h1 className="text-3xl font-bold leading-tight text-slate-900 dark:text-slate-50 md:text-4xl">
              Discover products curated for you.
            </h1>
            <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300 md:text-base">
              Browse our freshest arrivals, compare deals, and check out with a streamlined cart & payments flow.
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
                  <span>Real product details with images, variants, and specs.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-amber-500" />
                  <span>Secure checkout and payments, tracked per order.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Admin portal for catalog, reviews, and fulfillment.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Featured products</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">Hand-picked arrivals and promotions.</p>
          </div>
          <Link to="/products" className={linkBase}>
            Browse all
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {featured.length === 0 && <div className="col-span-4 text-sm text-slate-600">No featured products right now.</div>}
          {featured.map((p) => (
            <Link key={p.id} to={`/products/${p.slug}`} className="group overflow-hidden rounded-lg border p-3 hover:shadow-md">
              <div className="h-40 w-full overflow-hidden rounded-md bg-slate-100">
                {productImageUrl(p) ? (
                  <img src={productImageUrl(p)!} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">No image</div>
                )}
              </div>
              <div className="mt-2 grid gap-1">
                <div className="text-sm font-medium text-slate-900">{p.name}</div>
                <div className="text-xs text-slate-600">{p.brand_name ?? ''}</div>
                <div className="text-sm font-semibold text-slate-900">${p.price}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Categories</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">Browse by category.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {categories.map((c) => (
            <Link key={c.id} to={`/products?category=${c.id}`} className="inline-block rounded-md bg-white px-3 py-1 text-sm text-slate-700 shadow-sm">
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Brands</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">Shop by brand.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {brands.map((b) => (
            <Link key={b.id} to={`/products?brand=${b.id}`} className="inline-block rounded-md bg-white px-3 py-1 text-sm text-slate-700 shadow-sm">
              {b.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
