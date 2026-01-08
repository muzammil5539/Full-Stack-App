import { Link } from 'react-router-dom'

export default function HomePage() {
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
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Jump back in</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">Popular destinations to start browsing.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Link
            to="/products"
            className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-sky-100/60 via-white to-amber-100/40 opacity-80 transition group-hover:opacity-100 dark:from-sky-900/30 dark:via-slate-900 dark:to-amber-900/20" />
            <div className="relative grid gap-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-200">Browse</div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-50">All products</div>
              <div className="text-sm text-slate-600 dark:text-slate-300">Search, filter, and sort the full catalog.</div>
            </div>
          </Link>
          <Link
            to="/orders"
            className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/60 via-white to-sky-100/40 opacity-80 transition group-hover:opacity-100 dark:from-emerald-900/30 dark:via-slate-900 dark:to-sky-900/20" />
            <div className="relative grid gap-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-200">Orders</div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-50">Track purchases</div>
              <div className="text-sm text-slate-600 dark:text-slate-300">View statuses, payments, and history.</div>
            </div>
          </Link>
          <Link
            to="/admin"
            className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-100/60 via-white to-sky-100/40 opacity-80 transition group-hover:opacity-100 dark:from-fuchsia-900/30 dark:via-slate-900 dark:to-sky-900/20" />
            <div className="relative grid gap-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-fuchsia-700 dark:text-fuchsia-200">Admin</div>
              <div className="text-lg font-semibold text-slate-900 dark:text-slate-50">Manage catalog</div>
              <div className="text-sm text-slate-600 dark:text-slate-300">Edit products, categories, and docs.</div>
            </div>
          </Link>
        </div>
      </section>
    </div>
  )
}
