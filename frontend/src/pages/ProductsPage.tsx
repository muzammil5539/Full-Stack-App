import ProductList from '../features/products/components/ProductList'

export default function ProductsPage() {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <h1 style={{ margin: 0 }}>Products</h1>
      <ProductList />
    </div>
  )
}
