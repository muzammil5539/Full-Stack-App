import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ErrorMessage from '../../shared/ui/ErrorMessage'
import AdminRequired from '../../admin/AdminRequired'
import { findAdminResource } from '../../admin/resources'
import AutoAdminForm from './forms/AutoAdminForm'

export default function AdminModelAddPage() {
  const navigate = useNavigate()
  const params = useParams()
  const app = String(params.app ?? '')
  const model = String(params.model ?? '')

  const resource = useMemo(() => findAdminResource(app, model), [app, model])

  return (
    <AdminRequired>
      <div className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1>{resource ? `${resource.title} / Add` : 'Admin / Add'}</h1>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Path: <span className="font-mono">/admin/{app}/{model}/add/</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Link to={`/admin/${app}/${model}/`} className="text-sm">Back to change list</Link>
          </div>
        </div>

        {!resource ? (
          <ErrorMessage message="Unknown admin resource." />
        ) : (
          <AutoAdminForm
            apiPath={resource.apiPath}
            mode="create"
            onDone={() => navigate(`/admin/${app}/${model}/`, { replace: true })}
          />
        )}
      </div>
    </AdminRequired>
  )
}
