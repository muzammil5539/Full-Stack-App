import { useMemo, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AdminRequired from '../../admin/AdminRequired'
import { findAdminResource } from '../../admin/resources'
import { adminDelete } from '../../api/adminCrud'
import ErrorMessage from '../../shared/ui/ErrorMessage'
import AutoAdminForm from './forms/AutoAdminForm'
import { startAdminSpan, endSpan } from '../../telemetry/otel'

const linkBase = 'text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300'

export default function AdminModelEditPage() {
  const params = useParams()
  const app = String(params.app ?? '')
  const model = String(params.model ?? '')
  const id = String(params.id ?? '')

  const navigate = useNavigate()

  const resource = useMemo(() => findAdminResource(app, model), [app, model])

  useEffect(() => {
    const span = startAdminSpan(`admin.change.${app}.${model}.${id}`)
    return () => endSpan(span)
  }, [app, model, id])

  return (
    <AdminRequired>
      <div className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{resource ? `${resource.title} / Change` : 'Admin / Change'}</h1>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Path: <span className="font-mono">/admin/{app}/{model}/{id}/change/</span>
            </div>
          </div>
          <Link to={`/admin/${app}/${model}/`} className={[linkBase, 'text-sm'].join(' ')}>
            Back to list
          </Link>
        </div>

        {!resource ? (
          <ErrorMessage message="Unknown admin resource." />
        ) : (
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-slate-600 dark:text-slate-300">
                Actions affect <span className="font-mono">{resource.apiPath}{id}/</span>
              </div>
              <div className="flex gap-2">
                {resource.app === 'payments' && resource.model === 'payment' ? (
                  <>
                    <button
                      type="button"
                      className="inline-flex h-9 items-center justify-center rounded-md bg-emerald-600 px-3 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
                      onClick={async () => {
                        if (!window.confirm('Approve payment proof?')) return
                        const span = startAdminSpan(`admin.approve_proof.${app}.${model}.${id}`)
                        try {
                          await import('../../api/adminCrud').then((m) => m.adminPatch(resource.apiPath, id, { proof_status: 'approved', status: 'completed' }))
                          window.location.reload()
                        } catch (e) {
                          alert(e instanceof Error ? e.message : 'Failed')
                        } finally {
                          endSpan(span)
                        }
                      }}
                    >
                      Approve proof
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-9 items-center justify-center rounded-md bg-rose-600 px-3 text-sm font-medium text-white shadow-sm hover:bg-rose-700"
                      onClick={async () => {
                        if (!window.confirm('Reject payment proof?')) return
                        const span = startAdminSpan(`admin.reject_proof.${app}.${model}.${id}`)
                        try {
                          await import('../../api/adminCrud').then((m) => m.adminPatch(resource.apiPath, id, { proof_status: 'rejected', status: 'failed' }))
                          window.location.reload()
                        } catch (e) {
                          alert(e instanceof Error ? e.message : 'Failed')
                        } finally {
                          endSpan(span)
                        }
                      }}
                    >
                      Reject proof
                    </button>
                  </>
                ) : null}
                <button
                  type="button"
                  className="inline-flex h-9 items-center justify-center rounded-md bg-rose-600 px-3 text-sm font-medium text-white shadow-sm hover:bg-rose-700"
                  onClick={async () => {
                    const ok = window.confirm('Delete this object? This cannot be undone.')
                    if (!ok) return
                    const span = startAdminSpan(`admin.delete.${app}.${model}.${id}`)
                    try {
                      await adminDelete(resource.apiPath, id)
                      navigate(`/admin/${app}/${model}/`)
                    } finally {
                      endSpan(span)
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>

            <AutoAdminForm
              apiPath={resource.apiPath}
              mode="edit"
              id={id}
              onDone={() => window.location.reload()}
            />
          </div>
        )}
      </div>
    </AdminRequired>
  )
}
