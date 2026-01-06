import { useParams } from 'react-router-dom'

export default function ProductDetailPage() {
  const { slug } = useParams()

  return (
    <div className="grid gap-3">
      <h1>Product</h1>
      <div className="rounded-md border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="text-slate-500 dark:text-slate-400">Slug</div>
        <div className="font-medium">{slug}</div>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Starter page: next step is to fetch product details from the backend and show images, price,
        variants, and add-to-cart.
      </p>
    </div>
  )
}
