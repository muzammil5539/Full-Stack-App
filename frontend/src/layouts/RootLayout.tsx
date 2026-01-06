import { NavLink, Outlet } from 'react-router-dom'
import { useAuthToken } from '../auth/useAuthToken'

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
                <NavItem to="/account" label="Account" />
                <button
                  onClick={logout}
                  className="h-9"
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
          <Outlet />
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
