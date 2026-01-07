import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import AdminRequired from '../../admin/AdminRequired'
import { ADMIN_RESOURCES, type AdminResource } from '../../admin/resources'

export default function AdminPage() {
  return (
    <AdminRequired>
      <AdminDashboard />
    </AdminRequired>
  )
}

function AdminDashboard() {
  const groups = useMemo(() => {
    const byApp = new Map<string, AdminResource[]>()
    for (const resource of ADMIN_RESOURCES) {
      const key = resource.app
      if (!byApp.has(key)) byApp.set(key, [])
      byApp.get(key)!.push(resource)
    }
    return Array.from(byApp.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [])

  return (
    <div className="grid gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Manage all models using the frontend admin routes.
          </div>
        </div>
      </div>

      <div className="grid gap-5">
        {groups.map(([app, resources]) => (
          <section key={app} className="grid gap-3">
            <h2 className="text-base font-semibold">{app}</h2>

            <div className="grid gap-3 md:grid-cols-2">
              {resources
                .slice()
                .sort((a, b) => a.title.localeCompare(b.title))
                .map((r) => (
                  <div
                    key={`${r.app}:${r.model}`}
                    className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/30"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{r.title}</div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        /admin/{r.app}/{r.model}/
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        to={`/admin/${r.app}/${r.model}/add/`}
                        className="inline-flex h-9 items-center rounded-md bg-sky-600 px-3 text-sm font-medium text-white hover:bg-sky-700"
                      >
                        Add
                      </Link>
                      <Link
                        to={`/admin/${r.app}/${r.model}/`}
                        className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                      >
                        Change
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
