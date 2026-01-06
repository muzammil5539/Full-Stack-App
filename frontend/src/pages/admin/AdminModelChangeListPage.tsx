import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AdminRequired from '../../admin/AdminRequired'
import { findAdminResource } from '../../admin/resources'
import { getJson } from '../../api/http'
import ErrorMessage from '../../shared/ui/ErrorMessage'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string

type PaginatedResponse<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export default function AdminModelChangeListPage() {
  const params = useParams()
  const app = String(params.app ?? '')
  const model = String(params.model ?? '')
  const resource = useMemo(() => findAdminResource(app, model), [app, model])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<any[]>([])

  useEffect(() => {
    if (!resource) return

    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const apiPath = resource!.apiPath
        const data = await getJson<PaginatedResponse<any>>(`${API_BASE_URL}${apiPath}`)
        if (cancelled) return
        setRows(data.results)
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Failed to load list.')
      } finally {
        if (cancelled) return
        setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [resource])

  function displayValue(row: any): string {
    if (!resource?.displayFieldCandidates) return String(row?.id ?? '')
    for (const key of resource.displayFieldCandidates) {
      const v = row?.[key]
      if (v !== null && v !== undefined && String(v).trim() !== '') return String(v)
    }
    return String(row?.id ?? '')
  }

  return (
    <AdminRequired>
      <div className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1>{resource ? `${resource.title} / Change` : 'Admin / Change'}</h1>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Path: <span className="font-mono">/admin/{app}/{model}/</span>
            </div>
          </div>
          {resource ? (
            <Link
              to={`/admin/${app}/${model}/add/`}
              className="inline-flex h-9 items-center rounded-md bg-sky-600 px-3 text-sm font-medium text-white hover:bg-sky-700"
            >
              Add
            </Link>
          ) : null}
        </div>

        {!resource ? (
          <ErrorMessage message="Unknown admin resource." />
        ) : error ? (
          <ErrorMessage message={error} />
        ) : loading ? (
          <div className="text-sm text-slate-600 dark:text-slate-300">Loading…</div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 dark:bg-slate-900/40 dark:text-slate-300">
              {rows.length} item(s)
            </div>
            <ul className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-950">
              {rows.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{displayValue(row)}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">ID: {row.id}</div>
                  </div>
                  <Link
                    to={`/admin/${app}/${model}/${row.id}/change/`}
                    className="text-sm"
                  >
                    Edit
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </AdminRequired>
  )
}
