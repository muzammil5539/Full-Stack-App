import { Link } from 'react-router-dom'

export default function AuthRequired({ message }: { message?: string }) {
  return (
    <div className="grid gap-3">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        {message ?? 'You must be logged in to view this page.'}
      </p>
      <div>
        <Link
          to="/account/login"
          className="inline-flex h-9 items-center rounded-md bg-sky-600 px-3 text-sm font-medium text-white hover:bg-sky-700"
        >
          Go to login
        </Link>
      </div>
    </div>
  )
}
