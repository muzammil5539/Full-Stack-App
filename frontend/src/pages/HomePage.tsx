import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listBrands, listCategories, listProducts, type Brand, type Category, type Product } from '../api/products'
import ErrorMessage from '../shared/ui/ErrorMessage'
import Loading from '../shared/ui/Loading'

const PLACEHOLDER = 'https://placehold.co/600x400?text=Product'

function productImageUrl(p: Product): string {
  const primary = p.images?.find((img) => img.is_primary) ?? p.images?.[0]
  return (primary?.image_url ?? primary?.image) || PLACEHOLDER
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

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <Loading />
  if (error) return <ErrorMessage message={error} />

  return (
    <div className="space-y-10">
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-600 to-emerald-400 p-10 text-white">
        <div className="max-w-6xl mx-auto grid gap-6 md:grid-cols-2 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">Everyday essentials for modern living</h1>
            <p className="mt-4 text-lg opacity-90">Thoughtfully designed products — curated collections, minimal aesthetics.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 rounded-md bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:scale-105 transition"
              >
                Shop products
              </Link>
              <Link to="/cart" className="inline-flex items-center gap-2 rounded-md border border-white/40 px-4 py-2 text-sm font-medium text-white/95">
                View cart
              </Link>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="grid grid-cols-2 gap-3">
              <img src="https://placehold.co/600x400?text=Hero+1" alt="hero" className="w-full rounded-xl shadow-lg object-cover" />
              <img src="https://placehold.co/600x400?text=Hero+2" alt="hero" className="w-full rounded-xl shadow-lg object-cover" />
            </div>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Featured</h2>
            <p className="text-sm text-slate-500">Our picks for the season</p>
          </div>
          <Link to="/products" className="text-sky-600 hover:underline">Browse all</Link>
        </div>

        {featured.length === 0 ? (
          <div className="rounded-md border border-slate-200 bg-white p-6 text-center">No featured products right now.</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => (
              <div key={p.id} className="group rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition">
                <Link to={`/products/${encodeURIComponent(p.slug)}`} className="block">
                  <div className="h-48 w-full bg-slate-100 overflow-hidden">
                    <img src={productImageUrl(p)} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                </Link>
                <div className="p-4">
                  <Link to={`/products/${encodeURIComponent(p.slug)}`} className="block text-sm font-semibold text-slate-900 hover:text-sky-600">
                    {p.name}
                  </Link>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-lg font-bold">${p.price}</div>
                    {p.compare_price ? <div className="text-sm text-slate-500 line-through">${p.compare_price}</div> : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Categories</h2>
            <p className="text-sm text-slate-600">Browse by category.</p>
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

      <section className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Brands</h2>
            <p className="text-sm text-slate-600">Shop by brand.</p>
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
