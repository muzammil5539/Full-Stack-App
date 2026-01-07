import { useEffect, useState } from 'react'
import { getMyUser, type User } from '../api/accounts'
import { getAuthToken } from '../auth/token'

type AdminGateState =
  | { status: 'logged-out' }
  | { status: 'loading' }
  | { status: 'forbidden'; user: User }
  | { status: 'allowed'; user: User }
  | { status: 'error'; message: string }

export function useAdminGate(): AdminGateState {
  const token = getAuthToken()
  const [state, setState] = useState<AdminGateState>({ status: 'loading' })

  useEffect(() => {
    if (!token) return

    let cancelled = false
    async function run() {
      try {
        setState({ status: 'loading' })
        const me = await getMyUser()
        if (cancelled) return
        if (!me) {
          setState({ status: 'error', message: 'Unable to load current user.' })
          return
        }
        const isAdmin = Boolean(me.is_staff || me.is_superuser)
        setState(isAdmin ? { status: 'allowed', user: me } : { status: 'forbidden', user: me })
      } catch (e) {
        if (cancelled) return
        setState({ status: 'error', message: e instanceof Error ? e.message : 'Failed to load user.' })
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [token])

  if (!token) return { status: 'logged-out' }
  return state
}
