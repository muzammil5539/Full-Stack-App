import { useMemo, useState } from 'react'
import { adminCreate, adminPatch } from '../../../api/adminCrud'

type UserPayload = {
  email: string
  username: string
  first_name?: string
  last_name?: string
  is_active: boolean
  is_staff: boolean
  is_superuser: boolean
  password?: string
}

export default function UserForm({
  apiPath,
  initial,
  onDone,
}: {
  apiPath: string
  initial?: any
  onDone: () => void
}) {
  const [email, setEmail] = useState(String(initial?.email ?? ''))
  const [username, setUsername] = useState(String(initial?.username ?? ''))
  const [firstName, setFirstName] = useState(String(initial?.first_name ?? ''))
  const [lastName, setLastName] = useState(String(initial?.last_name ?? ''))
  const [password, setPassword] = useState('')

  const [isActive, setIsActive] = useState(Boolean(initial?.is_active ?? true))
  const [isStaff, setIsStaff] = useState(Boolean(initial?.is_staff ?? false))
  const [isSuperuser, setIsSuperuser] = useState(Boolean(initial?.is_superuser ?? false))

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => email.trim().length > 0 && username.trim().length > 0, [email, username])

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        if (!canSubmit) return

        try {
          setLoading(true)
          setError(null)

          const payload: UserPayload = {
            email: email.trim().toLowerCase(),
            username: username.trim(),
            first_name: firstName,
            last_name: lastName,
            is_active: isActive,
            is_staff: isStaff,
            is_superuser: isSuperuser,
          }

          // Only send password if provided
          if (password.trim().length > 0) payload.password = password

          if (initial?.id) {
            await adminPatch(apiPath, initial.id, payload)
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

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Username</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">First name</label>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Last name</label>
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Password {initial?.id ? '(optional)' : ''}</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder={initial?.id ? 'Leave blank to keep unchanged' : ''} />
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Active
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={isStaff} onChange={(e) => setIsStaff(e.target.checked)} />
          Staff
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={isSuperuser} onChange={(e) => setIsSuperuser(e.target.checked)} />
          Superuser
        </label>
      </div>

      <button
        type="submit"
        disabled={loading || !canSubmit}
        className="h-10 bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-60"
      >
        {loading ? 'Saving…' : initial?.id ? 'Save user' : 'Create user'}
      </button>
    </form>
  )
}
