import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { listMyAddresses, type Address } from '../api/accounts'
import { cancelOrder, getOrderById, type OrderDetail, type OrderItem } from '../api/orders'
import { listPaymentsForOrder, type Payment } from '../api/payments'
import UploadProofForm from '../components/UploadProofForm'
import { useAuthToken } from '../auth/useAuthToken'
import AuthRequired from '../shared/ui/AuthRequired'
import ErrorMessage from '../shared/ui/ErrorMessage'
import Loading from '../shared/ui/Loading'

type StatusHistoryEntry = {
  id: number
  status: string
  notes?: string
  created_at: string
}

function formatAddressLabel(a: Address): string {
  const parts = [a.full_name, a.address_line1, a.city, a.state, a.postal_code, a.country].filter(Boolean)
  return parts.join(', ')
}

function formatLineItemName(it: OrderItem): string {
  return it.product_details?.name ?? `Product #${it.product}`
}

// UploadProofForm is extracted to frontend/src/components/UploadProofForm.tsx

export default function OrderDetailPage() {
  const { isAuthenticated } = useAuthToken()
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [cancelling, setCancelling] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [paymentsError, setPaymentsError] = useState<string | null>(null)

  const orderId = useMemo(() => {
    const n = Number(id)
    return Number.isFinite(n) && n > 0 ? n : null
  }, [id])

  const addressById = useMemo(() => {
    const map = new Map<number, Address>()
    for (const a of addresses) map.set(a.id, a)
    return map
  }, [addresses])

  useEffect(() => {
    if (!isAuthenticated) return
    if (!orderId) {
      setError('Invalid order id')
      return
    }
    const orderIdValue = orderId

    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const [ord, addr] = await Promise.all([getOrderById(orderIdValue), listMyAddresses()])
        if (!cancelled) {
          setOrder(ord)
          setAddresses(addr)
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to load order'
        if (!cancelled) setError(message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, orderId])

  useEffect(() => {
    if (!isAuthenticated || !orderId) return
    let cancelled = false
    async function loadPayments() {
      try {
        setPaymentsError(null)
        const id = orderId
        if (!id) return
        const data = await listPaymentsForOrder(id)
        if (!cancelled) setPayments(data)
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to load payments'
        if (!cancelled) setPaymentsError(message)
      }
    }
    void loadPayments()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, orderId])

  async function handleCancel() {
    if (!order || cancelling) return
    const ok = window.confirm('Cancel this order? Pending payments will be cancelled.')
    if (!ok) return

    try {
      setCancelling(true)
      setActionMessage(null)
      const updated = await cancelOrder(order.id)
      setOrder(updated)
      setActionMessage('Order cancelled.')
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to cancel order'
      setActionMessage(message)
    } finally {
      setCancelling(false)
    }
  }

  if (!isAuthenticated) return <AuthRequired />
  if (loading) return <Loading label="Loading order…" />
  if (error) return <ErrorMessage message={error} />
  if (!order) return <div className="text-sm text-slate-600 dark:text-slate-300">Order not found.</div>

  const shipping = order.shipping_address ? addressById.get(order.shipping_address) ?? null : null
  const billing = order.billing_address ? addressById.get(order.billing_address) ?? null : null

  const statusHistory = (order as unknown as { status_history?: StatusHistoryEntry[] }).status_history ?? []

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{order.order_number}</h1>
          <div className="text-sm text-slate-600 dark:text-slate-300">Status: {order.status}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/orders"
            className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Back to orders
          </Link>
          <button
            type="button"
            onClick={handleCancel}
            disabled={['cancelled', 'shipped', 'delivered'].includes(order.status) || cancelling}
            className="inline-flex h-9 items-center rounded-md bg-rose-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelling ? 'Cancelling…' : 'Cancel order'}
          </button>
        </div>
      </div>

      {actionMessage ? (
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
          {actionMessage}
        </div>
      ) : null}

      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="text-sm font-semibold">Totals</div>
        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-600 dark:text-slate-300">Subtotal</span>
            <span className="font-semibold">{order.subtotal}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-600 dark:text-slate-300">Shipping</span>
            <span className="font-semibold">{order.shipping_cost}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-600 dark:text-slate-300">Tax</span>
            <span className="font-semibold">{order.tax}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-600 dark:text-slate-300">Discount</span>
            <span className="font-semibold">{order.discount}</span>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-3 dark:border-slate-800">
            <span className="text-slate-700 dark:text-slate-200">Total</span>
            <span className="text-lg font-bold">{order.total}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="text-sm font-semibold">Addresses</div>
        <div className="grid gap-2 md:grid-cols-2">
          <div className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
            <div className="mb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Shipping</div>
            <div className="text-sm text-slate-700 dark:text-slate-200">
              {shipping ? formatAddressLabel(shipping) : order.shipping_address ? `Address #${order.shipping_address}` : '—'}
            </div>
          </div>
          <div className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
            <div className="mb-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Billing</div>
            <div className="text-sm text-slate-700 dark:text-slate-200">
              {billing ? formatAddressLabel(billing) : order.billing_address ? `Address #${order.billing_address}` : '—'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="text-sm font-semibold">Items ({order.items.length})</div>
        <ul className="grid gap-2">
          {order.items.map((it) => (
            <li key={it.id} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-medium">{formatLineItemName(it)}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Qty: {it.quantity}</div>
              </div>
              <div className="text-sm font-semibold">{it.subtotal}</div>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="text-sm font-semibold">Status history</div>
        {statusHistory.length === 0 ? (
          <div className="text-sm text-slate-600 dark:text-slate-300">No history yet.</div>
        ) : (
          <ul className="grid gap-2">
            {statusHistory.map((h) => (
              <li key={h.id} className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
                <div className="flex items-start justify-between gap-3">
                  <strong className="text-sm font-semibold">{h.status}</strong>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(h.created_at).toLocaleString()}
                  </span>
                </div>
                {h.notes ? <div className="mt-1 text-sm text-slate-700 dark:text-slate-200">{h.notes}</div> : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {order.notes ? (
        <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="text-sm font-semibold">Notes</div>
          <div className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{order.notes}</div>
        </div>
      ) : null}

      <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="text-sm font-semibold">Payments</div>
        {paymentsError ? <div className="text-sm text-rose-700 dark:text-rose-300">{paymentsError}</div> : null}
        {payments.length === 0 && !paymentsError ? (
          <div className="text-sm text-slate-600 dark:text-slate-300">No payments yet.</div>
        ) : null}
        {payments.length > 0 ? (
          <ul className="grid gap-2">
            {payments.map((p) => (
              <li key={p.id} className="rounded-md border border-slate-200 p-3 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-semibold">{p.payment_method}</div>
                  <div className="text-sm font-semibold">{p.amount}</div>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Status: {p.status}</div>
                {p.transaction_id ? (
                  <div className="text-xs text-slate-500 dark:text-slate-400">Txn: {p.transaction_id}</div>
                ) : null}
                {/* Proof upload for cash on delivery payments */}
                {p.payment_method === 'cash_on_delivery' ? (
                  <div className="mt-2">
                    {p.proof_status && p.proof_status !== 'none' ? (
                      <div className="text-xs text-slate-500">Proof status: {p.proof_status}</div>
                    ) : (
                      <UploadProofForm
                        payment={p}
                        onUploaded={(updated) => setPayments((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))}
                      />
                    )}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  )
}
