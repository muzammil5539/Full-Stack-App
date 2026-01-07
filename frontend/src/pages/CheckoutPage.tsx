import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getMyCart, type CartItem } from '../api/cart'
import { createMyAddress, getMyUser, listMyAddresses, type Address, type CreateAddressInput } from '../api/accounts'
import { createOrderFromCart, type OrderDetail } from '../api/orders'
import { createPaymentForOrder, type Payment } from '../api/payments'
import { useAuthToken } from '../auth/useAuthToken'
import AuthRequired from '../shared/ui/AuthRequired'
import ErrorMessage from '../shared/ui/ErrorMessage'
import Loading from '../shared/ui/Loading'

function formatMoney(value: number): string {
  if (!Number.isFinite(value)) return '0.00'
  return value.toFixed(2)
}

function parseMoney(raw: string): number {
  const trimmed = raw.trim()
  if (!trimmed) return 0
  const n = Number(trimmed)
  return Number.isFinite(n) ? n : Number.NaN
}

function formatAddressLabel(a: Address): string {
  const parts = [a.full_name, a.address_line1, a.city, a.state, a.postal_code, a.country].filter(Boolean)
  return `${a.address_type.toUpperCase()}: ${parts.join(', ')}`
}

export default function CheckoutPage() {
  const { isAuthenticated } = useAuthToken()
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartLoading, setCartLoading] = useState(false)

  const [addressesLoading, setAddressesLoading] = useState(false)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [userId, setUserId] = useState<number | null>(null)

  const [shippingAddressId, setShippingAddressId] = useState<number | ''>('')
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true)
  const [billingAddressId, setBillingAddressId] = useState<number | ''>('')

  const [shippingCost, setShippingCost] = useState('0.00')
  const [tax, setTax] = useState('0.00')
  const [discount, setDiscount] = useState('0.00')
  const [notes, setNotes] = useState('')

  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<
    'cash_on_delivery' | 'credit_card' | 'debit_card' | 'paypal' | 'stripe'
  >('cash_on_delivery')
  const [payment, setPayment] = useState<Payment | null>(null)
  const [submittingPayment, setSubmittingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  const [showNewShipping, setShowNewShipping] = useState(false)
  const [showNewBilling, setShowNewBilling] = useState(false)
  const [creatingAddress, setCreatingAddress] = useState(false)

  const [newShipping, setNewShipping] = useState<Omit<CreateAddressInput, 'user' | 'address_type'>>({
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    is_default: false,
  })

  const [newBilling, setNewBilling] = useState<Omit<CreateAddressInput, 'user' | 'address_type'>>({
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    is_default: false,
  })

  const selectedIds = useMemo(() => {
    const qs = new URLSearchParams(location.search)
    const raw = (qs.get('items') ?? '').trim()
    if (!raw) return null
    const ids = raw
      .split(',')
      .map((s) => Number(s))
      .filter((n) => Number.isFinite(n) && n > 0)
    return ids.length ? ids : null
  }, [location.search])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setCartLoading(true)
        setError(null)
        const cart = await getMyCart()
        if (!cancelled) {
          setCartItems(cart.items)
        }
      } catch (e) {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : 'Failed to load cart'
          setError(message)
        }
      } finally {
        if (!cancelled) {
          setCartLoading(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setAddressesLoading(true)
        setError(null)
        const [me, addr] = await Promise.all([getMyUser(), listMyAddresses()])
        if (cancelled) return

        setUserId(me?.id ?? null)
        setAddresses(addr)

        const defaultShipping = addr.find((a) => a.address_type === 'shipping' && a.is_default) ??
          addr.find((a) => a.address_type === 'shipping')
        const defaultBilling = addr.find((a) => a.address_type === 'billing' && a.is_default) ??
          addr.find((a) => a.address_type === 'billing')

        if (defaultShipping) setShippingAddressId(defaultShipping.id)
        if (defaultBilling) setBillingAddressId(defaultBilling.id)
      } catch (e) {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : 'Failed to load addresses'
          setError(message)
        }
      } finally {
        if (!cancelled) setAddressesLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const itemsToCheckout = useMemo(() => {
    if (!selectedIds) return cartItems
    const set = new Set(selectedIds)
    return cartItems.filter((i) => set.has(i.id))
  }, [cartItems, selectedIds])

  const subtotal = useMemo(() => {
    return itemsToCheckout.reduce((sum, it) => {
      const n = Number(it.subtotal)
      return Number.isFinite(n) ? sum + n : sum
    }, 0)
  }, [itemsToCheckout])

  const shippingCostNum = parseMoney(shippingCost)
  const taxNum = parseMoney(tax)
  const discountNum = parseMoney(discount)

  const totalsError = useMemo(() => {
    if (!Number.isFinite(shippingCostNum) || shippingCostNum < 0) return 'Shipping must be a valid non-negative number'
    if (!Number.isFinite(taxNum) || taxNum < 0) return 'Tax must be a valid non-negative number'
    if (!Number.isFinite(discountNum) || discountNum < 0) return 'Discount must be a valid non-negative number'
    if (discountNum > subtotal + shippingCostNum + taxNum) return 'Discount cannot exceed subtotal + shipping + tax'
    return null
  }, [discountNum, shippingCostNum, subtotal, taxNum])

  const totalPreview = useMemo(() => {
    if (totalsError) return null
    return subtotal + shippingCostNum + taxNum - discountNum
  }, [discountNum, shippingCostNum, subtotal, taxNum, totalsError])

  const canPlaceOrder =
    itemsToCheckout.length > 0 &&
    !loading &&
    !cartLoading &&
    !addressesLoading &&
    !totalsError &&
    shippingAddressId !== '' &&
    (billingSameAsShipping ? true : billingAddressId !== '')

  async function handleCreateAddress(type: 'shipping' | 'billing') {
    if (!userId || creatingAddress) return
    const data = type === 'shipping' ? newShipping : newBilling

    const requiredMissing =
      !data.full_name.trim() ||
      !data.phone.trim() ||
      !data.address_line1.trim() ||
      !data.city.trim() ||
      !data.state.trim() ||
      !data.postal_code.trim() ||
      !data.country.trim()

    if (requiredMissing) {
      setError('Please fill all required address fields')
      return
    }

    try {
      setCreatingAddress(true)
      setError(null)
      const created = await createMyAddress({
        user: userId,
        address_type: type,
        ...data,
        address_line2: data.address_line2 ?? '',
        is_default: data.is_default ?? false,
      })

      setAddresses((prev) => [created, ...prev])
      if (type === 'shipping') {
        setShippingAddressId(created.id)
        setShowNewShipping(false)
      } else {
        setBillingAddressId(created.id)
        setShowNewBilling(false)
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to create address'
      setError(message)
    } finally {
      setCreatingAddress(false)
    }
  }

  if (!isAuthenticated) return <AuthRequired />

  async function submitPayment(targetOrder: OrderDetail) {
    if (submittingPayment) return
    try {
      setSubmittingPayment(true)
      setPaymentError(null)
      const created = await createPaymentForOrder({
        order: targetOrder.id,
        payment_method: paymentMethod,
      })
      setPayment(created)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to submit payment'
      setPaymentError(message)
    } finally {
      setSubmittingPayment(false)
    }
  }

  if (order) {
    return (
      <div className="grid gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Order confirmed</h1>
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="grid gap-1">
            <div>
              <span className="font-semibold">Order:</span> {order.order_number}
            </div>
            <div>
              <span className="font-semibold">Status:</span> {order.status}
            </div>
            <div>
              <span className="font-semibold">Total:</span> ${order.total}
            </div>
          </div>
        </div>

        <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="text-sm font-semibold">Payment</div>
          <div className="text-sm text-slate-700 dark:text-slate-200">
            <span className="font-medium">Method:</span> {paymentMethod}
          </div>
          {payment ? (
            <div className="grid gap-1 text-sm">
              <div>
                <span className="font-medium">Status:</span> {payment.status}
              </div>
              <div>
                <span className="font-medium">Amount:</span> {payment.amount}
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                disabled={submittingPayment}
                onClick={() => void submitPayment(order)}
                className="inline-flex h-10 items-center justify-center rounded-md bg-sky-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-sky-500"
              >
                {submittingPayment ? 'Submitting payment…' : 'Submit payment'}
              </button>
              {paymentError ? (
                <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
                  {paymentError}
                </div>
              ) : null}
            </>
          )}
        </div>

        <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="text-sm font-semibold">Items ({order.items.length})</div>
          <ul className="grid gap-2">
            {order.items.map((it) => (
              <li key={it.id} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">{it.product_details?.name ?? `Product #${it.product}`}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Qty: {it.quantity}</div>
                </div>
                <div className="text-sm font-semibold">{it.subtotal}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/orders')}
            className="inline-flex h-10 items-center justify-center rounded-md bg-sky-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-sky-700 dark:hover:bg-sky-500"
          >
            View orders
          </button>
          <button
            onClick={() => navigate('/')}
            className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Continue shopping
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>

      <p className="text-sm text-slate-600 dark:text-slate-300">Confirm addresses, totals, and place your order.</p>

      {cartLoading ? <Loading label="Loading selected items…" /> : null}
      {addressesLoading ? <Loading label="Loading addresses…" /> : null}
      {error && <ErrorMessage message={error} />}

      {!cartLoading && !error ? (
        itemsToCheckout.length === 0 ? (
          <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
            No items selected for checkout.
          </div>
        ) : (
          <>
            <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="text-sm font-semibold">Items ({itemsToCheckout.length})</div>
              <ul className="grid gap-2">
                {itemsToCheckout.map((it) => (
                  <li key={it.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{it.product_details?.name ?? `Product #${it.product}`}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">Qty: {it.quantity}</div>
                    </div>
                    <div className="text-sm font-semibold">{it.subtotal}</div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Addresses */}
            <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="text-sm font-semibold">Shipping address</div>
              <select
                value={shippingAddressId}
                onChange={(e) => setShippingAddressId(e.target.value ? Number(e.target.value) : '')}
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="">Select a shipping address…</option>
                {addresses
                  .filter((a) => a.address_type === 'shipping')
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {formatAddressLabel(a)}
                    </option>
                  ))}
              </select>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewShipping((v) => !v)}
                  className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  {showNewShipping ? 'Cancel' : 'Add new shipping address'}
                </button>
              </div>

              {showNewShipping ? (
                <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                  <div className="grid gap-2 md:grid-cols-2">
                    <input
                      value={newShipping.full_name}
                      onChange={(e) => setNewShipping((p) => ({ ...p, full_name: e.target.value }))}
                      placeholder="Full name*"
                      className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                    />
                    <input
                      value={newShipping.phone}
                      onChange={(e) => setNewShipping((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="Phone*"
                      className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                    />
                    <input
                      value={newShipping.address_line1}
                      onChange={(e) => setNewShipping((p) => ({ ...p, address_line1: e.target.value }))}
                      placeholder="Address line 1*"
                      className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 md:col-span-2"
                    />
                    <input
                      value={newShipping.address_line2}
                      onChange={(e) => setNewShipping((p) => ({ ...p, address_line2: e.target.value }))}
                      placeholder="Address line 2"
                      className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 md:col-span-2"
                    />
                    <input
                      value={newShipping.city}
                      onChange={(e) => setNewShipping((p) => ({ ...p, city: e.target.value }))}
                      placeholder="City*"
                      className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                    />
                    <input
                      value={newShipping.state}
                      onChange={(e) => setNewShipping((p) => ({ ...p, state: e.target.value }))}
                      placeholder="State*"
                      className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                    />
                    <input
                      value={newShipping.postal_code}
                      onChange={(e) => setNewShipping((p) => ({ ...p, postal_code: e.target.value }))}
                      placeholder="Postal code*"
                      className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                    />
                    <input
                      value={newShipping.country}
                      onChange={(e) => setNewShipping((p) => ({ ...p, country: e.target.value }))}
                      placeholder="Country*"
                      className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={!!newShipping.is_default}
                      onChange={(e) => setNewShipping((p) => ({ ...p, is_default: e.target.checked }))}
                    />
                    Set as default shipping address
                  </label>
                  <button
                    type="button"
                    disabled={creatingAddress || !userId}
                    onClick={() => void handleCreateAddress('shipping')}
                    className="inline-flex h-10 items-center justify-center rounded-md bg-sky-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-sky-500"
                  >
                    {creatingAddress ? 'Saving…' : 'Save shipping address'}
                  </button>
                </div>
              ) : null}

              <div className="mt-2 grid gap-2">
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={billingSameAsShipping}
                    onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                  />
                  Billing address same as shipping
                </label>

                {!billingSameAsShipping ? (
                  <>
                    <div className="text-sm font-semibold">Billing address</div>
                    <select
                      value={billingAddressId}
                      onChange={(e) => setBillingAddressId(e.target.value ? Number(e.target.value) : '')}
                      className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <option value="">Select a billing address…</option>
                      {addresses
                        .filter((a) => a.address_type === 'billing')
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            {formatAddressLabel(a)}
                          </option>
                        ))}
                    </select>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setShowNewBilling((v) => !v)}
                        className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                      >
                        {showNewBilling ? 'Cancel' : 'Add new billing address'}
                      </button>
                    </div>

                    {showNewBilling ? (
                      <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                        <div className="grid gap-2 md:grid-cols-2">
                          <input
                            value={newBilling.full_name}
                            onChange={(e) => setNewBilling((p) => ({ ...p, full_name: e.target.value }))}
                            placeholder="Full name*"
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                          />
                          <input
                            value={newBilling.phone}
                            onChange={(e) => setNewBilling((p) => ({ ...p, phone: e.target.value }))}
                            placeholder="Phone*"
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                          />
                          <input
                            value={newBilling.address_line1}
                            onChange={(e) => setNewBilling((p) => ({ ...p, address_line1: e.target.value }))}
                            placeholder="Address line 1*"
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 md:col-span-2"
                          />
                          <input
                            value={newBilling.address_line2}
                            onChange={(e) => setNewBilling((p) => ({ ...p, address_line2: e.target.value }))}
                            placeholder="Address line 2"
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950 md:col-span-2"
                          />
                          <input
                            value={newBilling.city}
                            onChange={(e) => setNewBilling((p) => ({ ...p, city: e.target.value }))}
                            placeholder="City*"
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                          />
                          <input
                            value={newBilling.state}
                            onChange={(e) => setNewBilling((p) => ({ ...p, state: e.target.value }))}
                            placeholder="State*"
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                          />
                          <input
                            value={newBilling.postal_code}
                            onChange={(e) => setNewBilling((p) => ({ ...p, postal_code: e.target.value }))}
                            placeholder="Postal code*"
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                          />
                          <input
                            value={newBilling.country}
                            onChange={(e) => setNewBilling((p) => ({ ...p, country: e.target.value }))}
                            placeholder="Country*"
                            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                          />
                        </div>
                        <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
                          <input
                            type="checkbox"
                            checked={!!newBilling.is_default}
                            onChange={(e) => setNewBilling((p) => ({ ...p, is_default: e.target.checked }))}
                          />
                          Set as default billing address
                        </label>
                        <button
                          type="button"
                          disabled={creatingAddress || !userId}
                          onClick={() => void handleCreateAddress('billing')}
                          className="inline-flex h-10 items-center justify-center rounded-md bg-sky-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-sky-500"
                        >
                          {creatingAddress ? 'Saving…' : 'Save billing address'}
                        </button>
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>
            </div>

            {/* Totals */}
            <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="text-sm font-semibold">Totals</div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-600 dark:text-slate-300">Subtotal</span>
                  <span className="font-semibold">${formatMoney(subtotal)}</span>
                </div>

                <label className="grid gap-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Shipping</span>
                  <input
                    value={shippingCost}
                    onChange={(e) => setShippingCost(e.target.value)}
                    onBlur={() => {
                      const n = parseMoney(shippingCost)
                      if (Number.isFinite(n) && n >= 0) setShippingCost(formatMoney(n))
                    }}
                    className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                    inputMode="decimal"
                    placeholder="0.00"
                  />
                </label>

                <label className="grid gap-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Tax</span>
                  <input
                    value={tax}
                    onChange={(e) => setTax(e.target.value)}
                    onBlur={() => {
                      const n = parseMoney(tax)
                      if (Number.isFinite(n) && n >= 0) setTax(formatMoney(n))
                    }}
                    className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                    inputMode="decimal"
                    placeholder="0.00"
                  />
                </label>

                <label className="grid gap-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Discount</span>
                  <input
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    onBlur={() => {
                      const n = parseMoney(discount)
                      if (Number.isFinite(n) && n >= 0) setDiscount(formatMoney(n))
                    }}
                    className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                    inputMode="decimal"
                    placeholder="0.00"
                  />
                </label>

                {totalsError ? (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                    {totalsError}
                  </div>
                ) : null}

                <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-3 dark:border-slate-800">
                  <span className="text-slate-700 dark:text-slate-200">Total</span>
                  <span className="text-lg font-bold">${formatMoney(totalPreview ?? 0)}</span>
                </div>
              </div>

              <label className="grid gap-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">Notes (optional)</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-slate-300 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                  placeholder="Delivery instructions, etc."
                />
              </label>
            </div>

            {/* Payment method */}
            <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="text-sm font-semibold">Payment method</div>
              <div className="grid gap-2">
                {(
                  [
                    { value: 'cash_on_delivery', label: 'Cash on Delivery' },
                    { value: 'credit_card', label: 'Credit Card' },
                    { value: 'debit_card', label: 'Debit Card' },
                    { value: 'paypal', label: 'PayPal' },
                    { value: 'stripe', label: 'Stripe' },
                  ] as const
                ).map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="payment_method"
                      value={opt.value}
                      checked={paymentMethod === opt.value}
                      onChange={() => setPaymentMethod(opt.value)}
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-200">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )
      ) : null}

      <button
        disabled={!canPlaceOrder}
        onClick={async () => {
          try {
            setLoading(true)
            setError(null)
            setPayment(null)
            setPaymentError(null)
            const itemIds = itemsToCheckout.map((i) => i.id)
            const billingId = billingSameAsShipping ? shippingAddressId : billingAddressId
            const created = await createOrderFromCart({
              item_ids: itemIds,
              shipping_address: shippingAddressId === '' ? undefined : shippingAddressId,
              billing_address: billingId === '' ? undefined : billingId,
              shipping_cost: shippingCostNum,
              tax: taxNum,
              discount: discountNum,
              notes: notes.trim() || undefined,
            })
            setOrder(created)
            await submitPayment(created)
          } catch (e) {
            const message = e instanceof Error ? e.message : 'Failed to place order'
            setError(message)
          } finally {
            setLoading(false)
          }
        }}
        className="inline-flex h-10 items-center justify-center rounded-md bg-sky-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-sky-500"
      >
        {loading ? 'Placing order…' : 'Place order from cart'}
      </button>

      {!canPlaceOrder && itemsToCheckout.length > 0 ? (
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Select addresses and ensure totals are valid to place your order.
        </div>
      ) : null}
    </div>
  )
}
