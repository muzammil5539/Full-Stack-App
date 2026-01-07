import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Welcome</h1>
      <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
        This is the starter storefront UI. Browse products, add to cart, and proceed to checkout.
      </p>
      <div className="flex gap-3">
        <Link
          to="/products"
          className="inline-flex h-9 items-center rounded-md bg-sky-600 px-3 text-sm font-medium text-white hover:bg-sky-700"
        >
          Browse products
        </Link>
        <Link
          to="/cart"
          className="inline-flex h-9 items-center rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-900"
        >
          View cart
        </Link>
      </div>
    </div>
  )
}
