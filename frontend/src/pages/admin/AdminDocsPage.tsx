import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminRequired from '../../admin/AdminRequired'
import { getJson } from '../../api/http'
import { frontendDocs, getFrontendDoc } from '../../docs/frontendDocs'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string

type DocListItem = {
  name: string
  title: string
}

type DocsListResponse = {
  docs: DocListItem[]
}

type DocDetailResponse = {
  name: string
  title: string
  content_type: string
  content: string
}

const linkBase = 'text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300'

export default function AdminDocsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [docs, setDocs] = useState<DocListItem[]>([])
  const [selected, setSelected] = useState<string>('')
  const [docLoading, setDocLoading] = useState(false)
  const [doc, setDoc] = useState<DocDetailResponse | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)

        const data = await getJson<DocsListResponse>(`${API_BASE_URL}/docs/`)
        const next = Array.isArray(data.docs) ? data.docs : []
        // include a small set of frontend docs (routes/components) after backend docs
        const combined = [...next, ...frontendDocs]

        if (!cancelled) {
          setDocs(combined)
          setSelected(combined[0]?.name ?? '')
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load docs list.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const selectedTitle = useMemo(() => {
    if (!selected) return null
    return docs.find((d) => d.name === selected)?.title ?? selected
  }, [docs, selected])

  useEffect(() => {
    const name: string = selected
    if (!name) {
      setDoc(null)
      return
    }

    let cancelled = false
    async function loadDoc() {
      try {
        setDocLoading(true)
        setError(null)
        if (name.startsWith('frontend:')) {
          const d = getFrontendDoc(name)
          if (!cancelled) setDoc(d)
          return
        }

        const data = await getJson<DocDetailResponse>(`${API_BASE_URL}/docs/${encodeURIComponent(name)}/`)
        if (!cancelled) setDoc(data)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load doc.')
      } finally {
        if (!cancelled) setDocLoading(false)
      }
    }

    void loadDoc()
    return () => {
      cancelled = true
    }
  }, [selected])

  return (
    <AdminRequired>
      <div className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Admin / Docs</h1>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Backend docs served from <span className="font-mono">/docs/</span> (admin-only).
            </div>
          </div>
          <Link to="/admin" className={[linkBase, 'text-sm'].join(' ')}>
            Back to admin
          </Link>
        </div>

        {loading ? (
          <div className="text-sm text-slate-600 dark:text-slate-300">Loading docs…</div>
        ) : error ? (
          <div className="text-sm text-rose-700 dark:text-rose-300">{error}</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-[260px_1fr]">
            <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">Documents</div>
              <div className="mt-2 grid gap-1">
                {docs.length === 0 ? (
                  <div className="text-sm text-slate-600 dark:text-slate-300">No docs found.</div>
                ) : (
                  docs.map((d) => (
                    <button
                      key={d.name}
                      type="button"
                      onClick={() => setSelected(d.name)}
                      className={[
                        'w-full rounded-md px-2 py-2 text-left text-sm',
                        selected === d.name
                          ? 'bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-900/30',
                      ].join(' ')}
                    >
                      <div className="font-medium">{d.title}</div>
                      <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{d.name}</div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {selectedTitle ?? 'Select a document'}
                  </div>
                  {doc?.name ? <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{doc.name}</div> : null}
                </div>
              </div>

              <div className="mt-3">
                {docLoading ? (
                  <div className="text-sm text-slate-600 dark:text-slate-300">Loading document…</div>
                ) : !doc ? (
                  <div className="text-sm text-slate-600 dark:text-slate-300">Select a document to view.</div>
                ) : (
                  <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-xs text-slate-900 dark:bg-slate-900/40 dark:text-slate-100">
                    {doc.content}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminRequired>
  )
}
