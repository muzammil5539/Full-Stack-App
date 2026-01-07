import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="grid gap-3">
      <h1 className="text-2xl font-semibold tracking-tight">404</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">Page not found.</p>
      <div>
        <Link
          to="/"
          className="inline-flex h-9 items-center rounded-md bg-sky-600 px-3 text-sm font-medium text-white hover:bg-sky-700"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
