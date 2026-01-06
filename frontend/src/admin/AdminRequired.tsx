import { Link } from 'react-router-dom'
import AuthRequired from '../shared/ui/AuthRequired'
import { useAdminGate } from './useAdminGate'

export default function AdminRequired({ children }: { children: React.ReactNode }) {
  const gate = useAdminGate()

  if (gate.status === 'logged-out') {
    return <AuthRequired message="Login required to access admin pages." />
  }

  if (gate.status === 'loading') {
    return <div className="text-sm text-slate-600 dark:text-slate-300">Checking admin access…</div>
  }

  if (gate.status === 'forbidden') {
    return (
      <div className="grid gap-3">
        <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-100">
          Forbidden: admin access required.
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-300">
          Logged in as <span className="font-medium">{gate.user.email}</span>.
        </div>
        <div className="flex gap-3">
          <Link to="/" className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
            Go home
          </Link>
          <Link to="/account" className="inline-flex h-9 items-center rounded-md bg-sky-600 px-3 text-sm font-medium text-white hover:bg-sky-700">
            Account
          </Link>
        </div>
      </div>
    )
  }

  if (gate.status === 'error') {
    return <div className="text-sm text-rose-700 dark:text-rose-300">{gate.message}</div>
  }

  return <>{children}</>
}
