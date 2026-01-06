import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <h1 style={{ margin: 0 }}>Welcome</h1>
      <p style={{ margin: 0, maxWidth: 720 }}>
        This is the starter storefront UI. Browse products, add to cart, and proceed to checkout.
      </p>
      <div>
        <Link to="/products">Go to products →</Link>
      </div>
    </div>
  )
}
