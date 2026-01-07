import { useAuthToken } from '../../auth/useAuthToken'
import AuthRequired from '../../shared/ui/AuthRequired'

export default function SettingsPage() {
  const { isAuthenticated } = useAuthToken()

  if (!isAuthenticated) return <AuthRequired />

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-300">Settings page.</p>
    </div>
  )
}
