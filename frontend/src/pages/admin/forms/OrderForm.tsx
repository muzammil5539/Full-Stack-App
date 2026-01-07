import { useMemo, useState } from 'react'
import { adminCreate, adminPatch } from '../../../api/adminCrud'

type OrderPayload = {
  user: number
  status: string
  shipping_address: number | null
  billing_address: number | null
  subtotal: string
  shipping_cost: string
  tax: string
  discount: string
  total: string
  notes?: string
  tracking_number?: string
}

const STATUSES: Array<{ value: string; label: string }> = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
]

const inputBase =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'

export default function OrderForm({
  apiPath,
  initial,
  onDone,
}: {
  apiPath: string
  initial?: unknown
  onDone: () => void
}) {
  const initialRecord = (initial && typeof initial === 'object' && !Array.isArray(initial)) ? (initial as Record<string, unknown>) : undefined

  const [userId, setUserId] = useState(String(initialRecord?.user ?? ''))
  const [status, setStatus] = useState(String(initialRecord?.status ?? 'pending'))
  const [shippingAddress, setShippingAddress] = useState(String(initialRecord?.shipping_address ?? ''))
  const [billingAddress, setBillingAddress] = useState(String(initialRecord?.billing_address ?? ''))

  const [subtotal, setSubtotal] = useState(String(initialRecord?.subtotal ?? '0'))
  const [shippingCost, setShippingCost] = useState(String(initialRecord?.shipping_cost ?? '0'))
  const [tax, setTax] = useState(String(initialRecord?.tax ?? '0'))
  const [discount, setDiscount] = useState(String(initialRecord?.discount ?? '0'))
  const [total, setTotal] = useState(String(initialRecord?.total ?? '0'))

  const [notes, setNotes] = useState(String(initialRecord?.notes ?? ''))
  const [trackingNumber, setTrackingNumber] = useState(String(initialRecord?.tracking_number ?? ''))

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => {
    return userId.trim().length > 0 && status.trim().length > 0
  }, [userId, status])

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        if (!canSubmit) return

        try {
          setLoading(true)
          setError(null)

          const payload: OrderPayload = {
            user: Number(userId),
            status,
            shipping_address: shippingAddress.trim() ? Number(shippingAddress) : null,
            billing_address: billingAddress.trim() ? Number(billingAddress) : null,
            subtotal,
            shipping_cost: shippingCost,
            tax,
            discount,
            total,
            notes,
            tracking_number: trackingNumber,
          }

          const id = initialRecord?.id
          if (typeof id === 'number') {
            await adminPatch(apiPath, id, payload)
          } else {
            await adminCreate(apiPath, payload)
          }

          onDone()
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Save failed')
        } finally {
          setLoading(false)
        }
      }}
      className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
    >
      {error ? <div className="text-sm text-rose-700 dark:text-rose-300">{error}</div> : null}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">User ID</label>
          <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="e.g. 1" required className={inputBase} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Status</label>
          <select
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Shipping Address ID (optional)</label>
          <input value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} placeholder="e.g. 10" className={inputBase} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Billing Address ID (optional)</label>
          <input value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)} placeholder="e.g. 11" className={inputBase} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Subtotal</label>
          <input value={subtotal} onChange={(e) => setSubtotal(e.target.value)} className={inputBase} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Shipping Cost</label>
          <input value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} className={inputBase} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Tax</label>
          <input value={tax} onChange={(e) => setTax(e.target.value)} className={inputBase} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Discount</label>
          <input value={discount} onChange={(e) => setDiscount(e.target.value)} className={inputBase} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Total</label>
          <input value={total} onChange={(e) => setTotal(e.target.value)} className={inputBase} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Notes</label>
        <textarea
          className="min-h-[90px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Tracking Number</label>
        <input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} className={inputBase} />
      </div>

      <button
        type="submit"
        disabled={loading || !canSubmit}
        className="inline-flex h-10 items-center justify-center rounded-md bg-sky-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-sky-500"
      >
        {loading ? 'Saving…' : typeof initialRecord?.id === 'number' ? 'Save order' : 'Create order'}
      </button>
    </form>
  )
}
