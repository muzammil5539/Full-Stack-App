import { NavLink, Outlet } from 'react-router-dom'
import { useAuthToken } from '../auth/useAuthToken'

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        textDecoration: 'none',
        fontWeight: isActive ? 700 : 500,
      })}
    >
      {label}
    </NavLink>
  )
}

export default function RootLayout() {
  const { isAuthenticated, logout } = useAuthToken()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          borderBottom: '1px solid rgba(127,127,127,0.35)',
          padding: '12px 16px',
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <NavItem to="/" label="Store" />

          <nav style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
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
                  style={{
                    border: '1px solid rgba(127,127,127,0.35)',
                    borderRadius: 8,
                    padding: '6px 10px',
                    background: 'transparent',
                    cursor: 'pointer',
                  }}
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

      <main style={{ flex: 1, padding: '20px 16px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>

      <footer
        style={{
          borderTop: '1px solid rgba(127,127,127,0.35)',
          padding: '12px 16px',
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto', fontSize: 12 }}>
          API: {import.meta.env.VITE_API_BASE_URL}
        </div>
      </footer>
    </div>
  )
}
