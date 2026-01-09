import { useEffect, useState } from 'react'
import { useAuthToken } from '../../auth/useAuthToken'
import AuthRequired from '../../shared/ui/AuthRequired'
import Loading from '../../shared/ui/Loading'
import ErrorMessage from '../../shared/ui/ErrorMessage'
import {
  listMyAddresses,
  type Address,
  createMyAddress,
  deleteMyAddress,
  changePassword,
} from '../../api/accounts'

export default function SettingsPage() {
  const { isAuthenticated } = useAuthToken()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [newAddrOpen, setNewAddrOpen] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null)

  // password form
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [pwSubmitting, setPwSubmitting] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const data = await listMyAddresses()
        if (!cancelled) setAddresses(data)
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : String(err)
          setError(message ?? 'Failed to load addresses')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  if (!isAuthenticated) return <AuthRequired />

  async function handleAddAddress(ev: React.FormEvent) {
    ev.preventDefault()
    const form = ev.target as HTMLFormElement
    const data = Object.fromEntries(new FormData(form)) as unknown as Record<string, string>
    try {
      setLoading(true)
      setError(null)
      const addrType = ((): 'billing' | 'shipping' => {
        const at = String(data.address_type || '').toLowerCase()
        return at === 'billing' ? 'billing' : 'shipping'
      })()

      await createMyAddress({
        user: Number(data.user) || 0,
        address_type: addrType,
        full_name: data.full_name || '',
        phone: data.phone || '',
        address_line1: data.address_line1 || '',
        address_line2: data.address_line2 || '',
        city: data.city || '',
        state: data.state || '',
        postal_code: data.postal_code || '',
        country: data.country || '',
        is_default: data.is_default === 'on',
      })
      const updated = await listMyAddresses()
      setAddresses(updated)
      setNewAddrOpen(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message ?? 'Failed to create address')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete address?')) return
    try {
      setLoading(true)
      await deleteMyAddress(id)
      setAddresses((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message ?? 'Failed to delete')
    } finally {
      setLoading(false)
    }
  }

  async function handleChangePassword(ev: React.FormEvent) {
    ev.preventDefault()
    setPwSubmitting(true)
    setPasswordMsg(null)
    try {
      await changePassword(oldPassword, newPassword)
      setPasswordMsg('Password changed successfully')
      setOldPassword('')
      setNewPassword('')
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setPasswordMsg(message ?? 'Failed to change password')
    } finally {
      setPwSubmitting(false)
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      </div>

      {loading && <Loading />}
      {error && <ErrorMessage message={error} />}

      <section className="grid gap-2">
        <h2 className="text-lg font-semibold">Addresses</h2>
        <div className="grid gap-2">
          {addresses.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-2 rounded-md border p-3">
              <div>
                <div className="font-medium">{a.full_name} {a.is_default ? '(default)' : ''}</div>
                <div className="text-sm text-slate-600">{a.address_line1} {a.address_line2}</div>
                <div className="text-xs text-slate-500">{a.city}, {a.state} {a.postal_code} • {a.country}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleDelete(a.id)} className="text-sm text-rose-600">Delete</button>
              </div>
            </div>
          ))}

          {newAddrOpen ? (
            <form onSubmit={handleAddAddress} className="grid gap-2 rounded-md border p-3">
              <input name="full_name" placeholder="Full name" className="input" />
              <input name="address_line1" placeholder="Address line 1" className="input" />
              <input name="address_line2" placeholder="Address line 2" className="input" />
              <input name="city" placeholder="City" className="input" />
              <input name="state" placeholder="State" className="input" />
              <input name="postal_code" placeholder="Postal code" className="input" />
              <input name="country" placeholder="Country" className="input" />
              <div className="flex gap-2">
                <button type="submit" className="inline-flex items-center rounded-md bg-sky-600 px-3 py-1 text-white">Save</button>
                <button type="button" onClick={() => setNewAddrOpen(false)} className="inline-flex items-center rounded-md border px-3 py-1">Cancel</button>
              </div>
            </form>
          ) : (
            <button onClick={() => setNewAddrOpen(true)} className="inline-flex items-center rounded-md bg-sky-600 px-3 py-1 text-white">Add address</button>
          )}
        </div>
      </section>

      <section className="grid gap-2">
        <h2 className="text-lg font-semibold">Change password</h2>
        {passwordMsg ? <div className="text-sm text-slate-700">{passwordMsg}</div> : null}
        <form onSubmit={handleChangePassword} className="grid gap-2 max-w-md">
          <input value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="Current password" type="password" className="input" />
          <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" type="password" className="input" />
          <div className="flex gap-2">
            <button type="submit" disabled={pwSubmitting} className="inline-flex items-center rounded-md bg-sky-600 px-3 py-1 text-white">Change password</button>
          </div>
        </form>
      </section>
    </div>
  )
}
