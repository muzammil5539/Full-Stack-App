import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import AdminRequired from '../../admin/AdminRequired'
import { findAdminResource } from '../../admin/resources'
import ErrorMessage from '../../shared/ui/ErrorMessage'
import AutoAdminForm from './forms/AutoAdminForm'

export default function AdminModelEditPage() {
  const params = useParams()
  const app = String(params.app ?? '')
  const model = String(params.model ?? '')
  const id = String(params.id ?? '')

  const resource = useMemo(() => findAdminResource(app, model), [app, model])

  return (
    <AdminRequired>
      <div className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1>{resource ? `${resource.title} / Change` : 'Admin / Change'}</h1>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Path: <span className="font-mono">/admin/{app}/{model}/{id}/change/</span>
            </div>
          </div>
          <Link to={`/admin/${app}/${model}/`} className="text-sm">Back to list</Link>
        </div>

        {!resource ? (
          <ErrorMessage message="Unknown admin resource." />
        ) : (
          <AutoAdminForm
            apiPath={resource.apiPath}
            mode="edit"
            id={id}
            onDone={() => window.location.reload()}
          />
        )}
      </div>
    </AdminRequired>
  )
}
