import { useEffect, useMemo, useState } from 'react'
import {
  adminCreate,
  adminCreateMultipart,
  adminOptions,
  adminPatch,
  adminPatchMultipart,
} from '../../../api/adminCrud'

const controlBase =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100'

const checkboxBase = 'h-4 w-4 rounded border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950'

const fileBase = 'w-full text-sm text-slate-900 dark:text-slate-100'

type Choice = {
  value: unknown
  display_name: string
}

type DrfField = {
  type?: string
  required?: boolean
  read_only?: boolean
  write_only?: boolean
  allow_null?: boolean
  allow_blank?: boolean
  max_length?: number
  min_length?: number
  label?: string
  help_text?: string
  choices?: Choice[]
  default?: unknown
}

type DrfActions = Record<string, Record<string, DrfField>>

type DrfOptionsResponse = {
  name?: string
  description?: string
  renders?: string[]
  parses?: string[]
  actions?: DrfActions
}

type FieldValue = string | boolean | string[] | File | null

type Props = {
  apiPath: string
  mode: 'create' | 'edit'
  id?: string
  onDone: () => void
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null
  if (Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function toLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function normalizeFieldType(field: DrfField): string {
  const t = (field.type || '').toLowerCase()
  if (!t) return 'string'
  return t
}

function isFileField(field: DrfField): boolean {
  const t = normalizeFieldType(field)
  return t.includes('file') || t.includes('image')
}

function isBooleanField(field: DrfField): boolean {
  return normalizeFieldType(field) === 'boolean'
}

function isMultiChoiceField(field: DrfField): boolean {
  return normalizeFieldType(field).includes('multiple') && normalizeFieldType(field).includes('choice')
}

function isChoiceField(field: DrfField): boolean {
  return normalizeFieldType(field).includes('choice') && Array.isArray(field.choices)
}

function isNumericField(field: DrfField): 'int' | 'float' | 'decimal' | null {
  const t = normalizeFieldType(field)
  if (t === 'integer') return 'int'
  if (t === 'float') return 'float'
  if (t === 'decimal') return 'decimal'
  return null
}

function inputModeFor(field: DrfField): React.HTMLAttributes<HTMLInputElement>['inputMode'] {
  const n = isNumericField(field)
  if (n === 'int') return 'numeric'
  if (n === 'float' || n === 'decimal') return 'decimal'
  return undefined
}

function htmlTypeFor(field: DrfField): string {
  const t = normalizeFieldType(field)
  if (t === 'email') return 'email'
  if (t === 'url') return 'url'
  if (t === 'password') return 'password'
  if (t === 'date') return 'date'
  if (t === 'datetime') return 'datetime-local'
  if (isNumericField(field)) return 'text'
  return 'text'
}

function coerceOutgoing(field: DrfField, raw: FieldValue): unknown {
  if (field.read_only) return undefined

  if (isFileField(field)) {
    return raw
  }

  if (isBooleanField(field)) {
    return Boolean(raw)
  }

  if (isMultiChoiceField(field)) {
    return Array.isArray(raw) ? raw : []
  }

  const numeric = isNumericField(field)
  if (numeric) {
    const s = typeof raw === 'string' ? raw.trim() : ''
    if (s === '') {
      return field.allow_null ? null : ''
    }
    if (numeric === 'int') return Number.parseInt(s, 10)
    if (numeric === 'float') return Number.parseFloat(s)
    // Keep decimals as strings to avoid rounding surprises; DRF DecimalField accepts strings.
    return s
  }

  if (isChoiceField(field)) {
    return raw === '' ? (field.allow_null ? null : '') : raw
  }

  const s = typeof raw === 'string' ? raw : ''
  if (s.trim() === '') {
    if (field.allow_null) return null
    if (field.allow_blank) return ''
  }
  return s
}

function toInitialValue(field: DrfField, existing: Record<string, unknown> | null, key: string): FieldValue {
  const fromExisting = existing ? existing[key] : undefined

  if (isFileField(field)) {
    return null
  }

  if (isBooleanField(field)) {
    if (fromExisting === undefined || fromExisting === null) return Boolean(field.default ?? false)
    return Boolean(fromExisting)
  }

  if (isMultiChoiceField(field)) {
    if (Array.isArray(fromExisting)) return fromExisting.map((v) => String(v))
    if (Array.isArray(field.default)) return field.default.map((v) => String(v))
    return []
  }

  if (fromExisting === undefined || fromExisting === null) {
    if (field.default === undefined || field.default === null) return ''
    return String(field.default)
  }

  return String(fromExisting)
}

export default function AutoAdminForm({ apiPath, mode, id, onDone }: Props) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [fields, setFields] = useState<Record<string, DrfField> | null>(null)
  const [values, setValues] = useState<Record<string, FieldValue>>({})

  const [existing, setExisting] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)

        const options = await adminOptions<DrfOptionsResponse>(apiPath, mode === 'edit' ? id : undefined)
        const method = mode === 'edit' ? 'PUT' : 'POST'
        const actionFields = options?.actions?.[method] ?? options?.actions?.['PATCH'] ?? options?.actions?.['POST']
        if (!actionFields) {
          throw new Error('This endpoint did not expose field metadata (OPTIONS.actions).')
        }

        let loadedExisting: Record<string, unknown> | null = null
        if (mode === 'edit') {
          if (!id) throw new Error('Missing id')
          const url = `${import.meta.env.VITE_API_BASE_URL as string}${apiPath}${id}/`
          const response = await fetch(url, {
            headers: {
              Accept: 'application/json',
              ...(localStorage.getItem('auth_token') ? { Authorization: `Token ${localStorage.getItem('auth_token')}` } : {}),
            },
          })
          if (!response.ok) {
            const text = await response.text().catch(() => '')
            throw new Error(text || `Failed to load (${response.status})`)
          }
          loadedExisting = asRecord(await response.json())
        }

        if (!cancelled) {
          setExisting(loadedExisting)
          setFields(actionFields)
        }

        const nextValues: Record<string, FieldValue> = {}
        for (const [key, field] of Object.entries(actionFields)) {
          if (field.read_only) continue
          nextValues[key] = toInitialValue(field, loadedExisting, key)
        }
        if (!cancelled) setValues(nextValues)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load form schema.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [apiPath, mode, id])

  const fieldEntries = useMemo(() => {
    const entries = Object.entries(fields ?? {})
      .filter(([, f]) => !f.read_only)
      .sort(([a], [b]) => a.localeCompare(b))
    return entries
  }, [fields])

  const hasFile = useMemo(() => {
    return fieldEntries.some(([k, f]) => isFileField(f) && values[k] instanceof File)
  }, [fieldEntries, values])

  if (loading) {
    return <div className="text-sm text-slate-600 dark:text-slate-300">Loading form…</div>
  }

  if (error) {
    return <div className="text-sm text-rose-700 dark:text-rose-300">{error}</div>
  }

  if (!fields) {
    return <div className="text-sm text-slate-600 dark:text-slate-300">No fields available.</div>
  }

  return (
    <form
      className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
      onSubmit={async (e) => {
        e.preventDefault()

        try {
          setSaving(true)
          setError(null)

          const payload: Record<string, unknown> = {}
          const formData = new FormData()

          for (const [key, field] of fieldEntries) {
            if (field.read_only) continue

            const raw = values[key]
            const outgoing = coerceOutgoing(field, raw)

            if (outgoing === undefined) continue

            if (isFileField(field)) {
              if (outgoing instanceof File) {
                formData.append(key, outgoing)
              } else {
                // leave empty to avoid wiping existing file
              }
            } else if (isMultiChoiceField(field)) {
              const arr = Array.isArray(outgoing) ? outgoing : []
              // For multipart, append repeated keys; for JSON, send array.
              if (hasFile) {
                for (const v of arr) formData.append(key, String(v))
              } else {
                payload[key] = arr
              }
            } else {
              if (hasFile) {
                if (outgoing === null) {
                  formData.append(key, '')
                } else {
                  formData.append(key, String(outgoing))
                }
              } else {
                payload[key] = outgoing
              }
            }
          }

          if (mode === 'edit') {
            if (!id) throw new Error('Missing id')
            if (hasFile) {
              await adminPatchMultipart(apiPath, id, formData)
            } else {
              await adminPatch(apiPath, id, payload)
            }
          } else {
            if (hasFile) {
              await adminCreateMultipart(apiPath, formData)
            } else {
              await adminCreate(apiPath, payload)
            }
          }

          onDone()
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Save failed')
        } finally {
          setSaving(false)
        }
      }}
    >
      <div className="grid gap-3 md:grid-cols-2">
      {fieldEntries.map(([key, field]) => {
        const label = field.label || toLabel(key)
        const help = field.help_text
        const required = Boolean(field.required)
        const value = values[key]

        const t = normalizeFieldType(field)
        const isLongText = t === 'text' || key.includes('description') || key.includes('notes')
        const wantsFullWidth =
          isLongText ||
          isFileField(field) ||
          (isMultiChoiceField(field) && Array.isArray(field.choices)) ||
          isBooleanField(field)

        const wrapperClass = wantsFullWidth ? 'md:col-span-2' : ''

        const common = (
          <div className="grid gap-1">
            <div className="flex items-baseline justify-between gap-3">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {label}
                {required ? <span className="text-rose-600"> *</span> : null}
              </label>
              {field.write_only ? <span className="text-[11px] text-slate-500">write-only</span> : null}
            </div>
            {help ? <div className="text-xs text-slate-500 dark:text-slate-400">{help}</div> : null}
          </div>
        )

        if (isBooleanField(field)) {
          return (
            <div key={key} className={["rounded-md border border-slate-200 p-3 dark:border-slate-800", wrapperClass].join(' ')}>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className={checkboxBase}
                  checked={Boolean(value)}
                  onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.checked }))}
                />
                <span>{label}</span>
              </label>
              {help ? <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{help}</div> : null}
            </div>
          )
        }

        if (isFileField(field)) {
          return (
            <div key={key} className={["grid gap-1", wrapperClass].join(' ')}>
              {common}
              <input
                type="file"
                required={mode === 'create' && required}
                className={fileBase}
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null
                  setValues((v) => ({ ...v, [key]: f }))
                }}
              />
              {mode === 'edit' && existing?.[key] ? (
                <div className="text-xs text-slate-500 dark:text-slate-400">Current: {String(existing[key])}</div>
              ) : null}
            </div>
          )
        }

        if (isMultiChoiceField(field) && Array.isArray(field.choices)) {
          const selected = Array.isArray(value) ? value : []
          return (
            <div key={key} className={["grid gap-1", wrapperClass].join(' ')}>
              {common}
              <select
                multiple
                className={[controlBase, 'min-h-[140px] text-sm'].join(' ')}
                value={selected}
                onChange={(e) => {
                  const next = Array.from(e.target.selectedOptions).map((o) => o.value)
                  setValues((v) => ({ ...v, [key]: next }))
                }}
              >
                {field.choices.map((c) => (
                  <option key={String(c.value)} value={String(c.value)}>
                    {c.display_name}
                  </option>
                ))}
              </select>
            </div>
          )
        }

        if (isChoiceField(field) && Array.isArray(field.choices)) {
          return (
            <div key={key} className={["grid gap-1", wrapperClass].join(' ')}>
              {common}
              <select
                className={[controlBase, 'h-10 text-sm'].join(' ')}
                value={typeof value === 'string' ? value : ''}
                onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                required={required && mode === 'create'}
              >
                <option value="">Select…</option>
                {field.choices.map((c) => (
                  <option key={String(c.value)} value={String(c.value)}>
                    {c.display_name}
                  </option>
                ))}
              </select>
            </div>
          )
        }
        const numericKind = isNumericField(field)

        if (isLongText) {
          return (
            <div key={key} className={["grid gap-1", wrapperClass].join(' ')}>
              {common}
              <textarea
                className={[controlBase, 'min-h-[140px] text-sm'].join(' ')}
                value={typeof value === 'string' ? value : ''}
                onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                required={required && mode === 'create'}
              />
            </div>
          )
        }

        return (
          <div key={key} className={["grid gap-1", wrapperClass].join(' ')}>
            {common}
            <input
              type={htmlTypeFor(field)}
              inputMode={inputModeFor(field)}
              className={controlBase}
              value={typeof value === 'string' ? value : ''}
              onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
              placeholder={numericKind ? (numericKind === 'int' ? '0' : '0.00') : undefined}
              required={required && mode === 'create'}
            />
          </div>
        )
      })}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-10 items-center justify-center rounded-md bg-sky-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-sky-500"
        >
          {saving ? 'Saving…' : mode === 'edit' ? 'Save' : 'Create'}
        </button>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Uses DRF OPTIONS metadata for fields.
        </div>
      </div>
    </form>
  )
}
