import ProductList from '../features/products/components/ProductList'

export default function ProductsPage() {
  return (
    <div className="grid gap-5">
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-sky-50 via-white to-emerald-50 p-5 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-sky-950/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid gap-1">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Products</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">Browse, compare, and add to cart.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">Search & filters supported</span>
            <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">Real images & variants</span>
          </div>
        </div>
      </section>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <ProductList />
      </div>
    </div>
  )
}
