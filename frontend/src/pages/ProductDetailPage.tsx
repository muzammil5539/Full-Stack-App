import { useParams } from 'react-router-dom'

export default function ProductDetailPage() {
  const { slug } = useParams()

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <h1 style={{ margin: 0 }}>Product</h1>
      <p style={{ margin: 0 }}>Slug: {slug}</p>
      <p style={{ margin: 0 }}>
        Starter page: next step is to fetch product details from the backend and show images, price,
        variants, and add-to-cart.
      </p>
    </div>
  )
}
