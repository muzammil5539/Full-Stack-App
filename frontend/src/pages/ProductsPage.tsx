import ProductList from '../features/products/components/ProductList'

export default function ProductsPage() {
  return (
    <div className="grid gap-4">
      <div className="flex items-end justify-between gap-4">
        <h1>Products</h1>
        <div className="text-xs text-slate-500 dark:text-slate-400">Browse & add to cart</div>
      </div>
      <ProductList />
    </div>
  )
}
