import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  clearCart,
  decrementCartItem,
  getMyCart,
  incrementCartItem,
  removeCartItem,
  setCartItemQuantity,
  type Cart,
} from '../api/cart'
import { useAuthToken } from '../auth/useAuthToken'
import AuthRequired from '../shared/ui/AuthRequired'
import ErrorMessage from '../shared/ui/ErrorMessage'
import Loading from '../shared/ui/Loading'

const buttonBase =
  'inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800'

const linkBase = 'text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300'

const checkboxBase = 'h-4 w-4 rounded border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950'

export default function CartPage() {
  const { isAuthenticated } = useAuthToken()
  const [cart, setCart] = useState<Cart | null>(null)
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([])
  const [selectionStale, setSelectionStale] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingByItemId, setPendingByItemId] = useState<Record<number, boolean>>({})
  const [qtyDraftByItemId, setQtyDraftByItemId] = useState<Record<number, string>>({})

  async function refresh() {
    try {
      setLoading(true)
      setError(null)
      const data = await getMyCart()
      setCart(data)

      // Preserve existing selections when possible; default to select all.
      setSelectedItemIds((prev) => {
        const nextIds = data.items.map((i) => i.id)
        if (prev.length === 0) return nextIds
        const nextSet = new Set(nextIds)
        const kept = prev.filter((id) => nextSet.has(id))
        // if some previously-selected ids are missing, mark selection stale
        if (kept.length < prev.length) setSelectionStale(true)
        return kept.length ? kept : nextIds
      })

      // Keep quantity drafts in sync
      setQtyDraftByItemId((prev) => {
        const next: Record<number, string> = { ...prev }
        const nextSet = new Set<number>()
        for (const item of data.items) {
          nextSet.add(item.id)
          if (next[item.id] === undefined) next[item.id] = String(item.quantity)
        }
        for (const key of Object.keys(next)) {
          const id = Number(key)
          if (!nextSet.has(id)) delete next[id]
        }
        return next
      })
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load cart'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  function setPending(itemId: number, pending: boolean) {
    setPendingByItemId((prev) => {
      const next = { ...prev }
      if (pending) next[itemId] = true
      else delete next[itemId]
      return next
    })
  }

  async function commitQuantity(itemId: number) {
    const raw = (qtyDraftByItemId[itemId] ?? '').trim()
    if (raw === '') return
    const nextQty = Number(raw)
    if (!Number.isFinite(nextQty) || nextQty < 0) return
    if (pendingByItemId[itemId]) return
    try {
      setPending(itemId, true)
      await setCartItemQuantity(itemId, nextQty)
      await refresh()
    } finally {
      setPending(itemId, false)
    }
  }

  const allIds = useMemo(() => (cart ? cart.items.map((i) => i.id) : []), [cart])
  const allSelected = cart ? selectedItemIds.length > 0 && selectedItemIds.length === cart.items.length : false

  const checkoutTo = useMemo(() => {
    if (!selectedItemIds.length) return '/checkout'
    return `/checkout?items=${encodeURIComponent(selectedItemIds.join(','))}`
  }, [selectedItemIds])

  const selectedSubtotal = useMemo(() => {
    if (!cart) return '0.00'
    const sum = cart.items
      .filter((i) => selectedItemIds.includes(i.id))
      .reduce((acc, it) => acc + Number(it.subtotal ?? 0), 0)
    return sum.toFixed(2)
  }, [cart, selectedItemIds])

  useEffect(() => {
    if (!isAuthenticated) return
    void refresh()
  }, [isAuthenticated])

  if (!isAuthenticated) return <AuthRequired />

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Cart</h1>
        <div className="flex flex-wrap gap-2">
        <button
          onClick={async () => {
            await clearCart()
            await refresh()
          }}
          className={[buttonBase, 'h-9'].join(' ')}
        >
          Clear cart
        </button>
        <Link
          to={checkoutTo}
          className={[
            'inline-flex h-9 items-center rounded-md bg-sky-600 px-3 text-sm font-medium text-white hover:bg-sky-700',
            selectedItemIds.length ? '' : 'pointer-events-none opacity-60',
          ].join(' ')}
        >
          Checkout selected
        </Link>
        </div>
      </div>

      {loading && <Loading label="Loading cart…" />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && cart && (
        <div className="grid gap-3">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="text-sm font-semibold">Total items: {cart.total_items}</div>
            <div className="text-sm font-semibold">Total: {cart.total_price}</div>
          </div>

          {cart.items.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-950">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className={checkboxBase}
                  checked={allSelected}
                  onChange={(e) => {
                    setSelectedItemIds(e.target.checked ? allIds : [])
                  }}
                />
                Select all
              </label>
              <div className="text-slate-600 dark:text-slate-300">Selected: {selectedItemIds.length}</div>
              <div className="text-sm font-semibold">Selected subtotal: ${selectedSubtotal}</div>
              {selectionStale ? (
                <div className="ml-2 flex items-center gap-2 text-xs text-rose-600">
                  <span>Selection changed — some items were removed or updated.</span>
                  <button
                    onClick={() => {
                      // reset selection to current items
                      setSelectedItemIds(cart.items.map((i) => i.id))
                      setSelectionStale(false)
                    }}
                    className={[buttonBase, 'h-7 px-2 text-xs'].join(' ')}
                  >
                    Re-select all
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          {cart.items.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Empty.{' '}
              <Link to="/products" className={linkBase}>
                Browse products
              </Link>
              .
            </p>
          ) : (
            cart.items.map((it) => (
              <div
                key={it.id}
                className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <input
                    type="checkbox"
                    className={[checkboxBase, 'mt-1'].join(' ')}
                    checked={selectedItemIds.includes(it.id)}
                    onChange={(e) => {
                      setSelectedItemIds((prev) => {
                        if (e.target.checked) return prev.includes(it.id) ? prev : [...prev, it.id]
                        return prev.filter((id) => id !== it.id)
                      })
                    }}
                  />

                  <div className="grid min-w-0 gap-2">
                  <strong className="text-sm font-semibold">{it.product_details?.name ?? `Product #${it.product}`}</strong>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>Price: {it.price}</span>
                    <span>•</span>
                    <span>Subtotal: {it.subtotal}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      disabled={Boolean(pendingByItemId[it.id])}
                      onClick={async () => {
                        if (pendingByItemId[it.id]) return
                        try {
                          setPending(it.id, true)
                          await decrementCartItem(it.id)
                          await refresh()
                        } finally {
                          setPending(it.id, false)
                        }
                      }}
                      className={[buttonBase, 'h-9 w-9 px-0'].join(' ')}
                      aria-label="Decrease quantity"
                      type="button"
                    >
                      −
                    </button>

                    <input
                      value={qtyDraftByItemId[it.id] ?? String(it.quantity)}
                      onChange={(e) => {
                        setQtyDraftByItemId((prev) => ({ ...prev, [it.id]: e.target.value }))
                      }}
                      onBlur={() => {
                        void commitQuantity(it.id)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur()
                        }
                      }}
                      inputMode="numeric"
                      className="h-9 w-16 rounded-md border border-slate-300 bg-white px-2 text-center text-sm text-slate-900 shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      aria-label="Quantity"
                    />

                    <button
                      disabled={Boolean(pendingByItemId[it.id])}
                      onClick={async () => {
                        if (pendingByItemId[it.id]) return
                        try {
                          setPending(it.id, true)
                          await incrementCartItem(it.id)
                          await refresh()
                        } finally {
                          setPending(it.id, false)
                        }
                      }}
                      className={[buttonBase, 'h-9 w-9 px-0'].join(' ')}
                      aria-label="Increase quantity"
                      type="button"
                    >
                      +
                    </button>
                  </div>
                </div>
                </div>
                <button
                  onClick={async () => {
                    await removeCartItem(it.id)
                    await refresh()
                  }}
                  className={[buttonBase, 'h-9'].join(' ')}
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
