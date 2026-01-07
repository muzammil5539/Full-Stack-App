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

const inputBase =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'

const checkboxBase = 'h-4 w-4 rounded border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950'

export default function UserForm({
  apiPath,
  initial,
  onDone,
}: {
  apiPath: string
  initial?: unknown
  onDone: () => void
}) {
  const initialRecord = (initial && typeof initial === 'object' && !Array.isArray(initial)) ? (initial as Record<string, unknown>) : undefined
  const isEditing = typeof initialRecord?.id === 'number'

  const [email, setEmail] = useState(String(initialRecord?.email ?? ''))
  const [username, setUsername] = useState(String(initialRecord?.username ?? ''))
  const [firstName, setFirstName] = useState(String(initialRecord?.first_name ?? ''))
  const [lastName, setLastName] = useState(String(initialRecord?.last_name ?? ''))
  const [password, setPassword] = useState('')

  const [isActive, setIsActive] = useState(Boolean(initialRecord?.is_active ?? true))
  const [isStaff, setIsStaff] = useState(Boolean(initialRecord?.is_staff ?? false))
  const [isSuperuser, setIsSuperuser] = useState(Boolean(initialRecord?.is_superuser ?? false))

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

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className={inputBase} />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Username</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} required className={inputBase} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">First name</label>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputBase} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Last name</label>
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputBase} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Password {isEditing ? '(optional)' : ''}</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder={isEditing ? 'Leave blank to keep unchanged' : ''} className={inputBase} />
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className={checkboxBase} />
          Active
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={isStaff} onChange={(e) => setIsStaff(e.target.checked)} className={checkboxBase} />
          Staff
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={isSuperuser} onChange={(e) => setIsSuperuser(e.target.checked)} className={checkboxBase} />
          Superuser
        </label>
      </div>

      <button
        type="submit"
        disabled={loading || !canSubmit}
        className="inline-flex h-10 items-center justify-center rounded-md bg-sky-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-sky-500"
      >
        {loading ? 'Saving…' : typeof initialRecord?.id === 'number' ? 'Save user' : 'Create user'}
      </button>
    </form>
  )
}
