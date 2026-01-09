import { NavLink, Outlet } from 'react-router-dom'
import { useAuthToken } from '../auth/useAuthToken'
import { useAdminGate } from '../admin/useAdminGate'
import ErrorBoundary from '../shared/ui/ErrorBoundary'

const buttonBase =
  'inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800'

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'text-sm font-medium transition-colors',
          isActive ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100',
        ].join(' ')
      }
    >
      {label}
    </NavLink>
  )
}

export default function RootLayout() {
  const { isAuthenticated, logout } = useAuthToken()
  const adminGate = useAdminGate()

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/60"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <NavLink
            to="/"
            className="text-base font-semibold tracking-tight text-slate-900 hover:text-slate-900 dark:text-slate-100"
          >
            Store
          </NavLink>

          <nav className="flex flex-wrap items-center gap-4">
            <NavItem to="/products" label="Products" />
            <NavItem to="/cart" label="Cart" />
            <NavItem to="/wishlist" label="Wishlist" />
            <NavItem to="/orders" label="Orders" />
            <NavItem to="/notifications" label="Notifications" />
            <NavItem to="/payments" label="Payments" />
            {isAuthenticated ? (
              <>
                {adminGate.status === 'allowed' ? <NavItem to="/admin" label="Admin" /> : null}
                <NavItem to="/account" label="Profile" />
                <NavItem to="/account/settings" label="Settings" />
                <button
                  onClick={logout}
                  className={[buttonBase, 'h-9'].join(' ')}
                >
                  Logout
                </button>
              </>
            ) : (
              <NavItem to="/account/login" label="Login" />
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>

      <footer
        className="border-t border-slate-200 py-3 dark:border-slate-800"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 text-xs text-slate-500 dark:text-slate-400">
          <div>API: {import.meta.env.VITE_API_BASE_URL}</div>
          <div>© {new Date().getFullYear()}</div>
        </div>
      </footer>
    </div>
  )
}
