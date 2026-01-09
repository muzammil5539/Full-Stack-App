export type ApiError = {
  message: string
  status?: number
}

function formatApiErrorBody(body: unknown): string | null {
  if (!body) return null
  if (typeof body === 'string') return body
  if (typeof body === 'object') {
    const record = body as Record<string, unknown>
    if (typeof record.detail === 'string') return record.detail
    if (typeof record.error === 'string') {
      const details = record.details
      if (details && typeof details === 'object') {
        try {
          return `${record.error}: ${JSON.stringify(details)}`
        } catch {
          return record.error
        }
      }
      return record.error
    }

    // Django/DRF validation errors often look like {field: ["msg"]}
    const parts: string[] = []
    for (const [key, value] of Object.entries(record)) {
      if (Array.isArray(value)) {
        parts.push(`${key}: ${value.filter((v) => typeof v === 'string').join(' ')}`)
      } else if (typeof value === 'string') {
        parts.push(`${key}: ${value}`)
      }
    }
    if (parts.length > 0) return parts.join(' | ')
  }
  return null
}

async function readErrorMessage(response: Response): Promise<{ message: string; details?: unknown }> {
  const fallback = `Request failed (${response.status})`
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    try {
      const data = await response.json()
      const message = formatApiErrorBody(data) || fallback
      return { message, details: data }
    } catch {
      // fall through to text
    }
  }

  const text = await response.text().catch(() => '')
  if (!text) return { message: fallback }

  try {
    const data = JSON.parse(text) as unknown
    const message = formatApiErrorBody(data) || text
    return { message, details: data }
  } catch {
    return { message: text }
  }
}

function getAuthHeader(): Record<string, string> {
  try {
    const raw = localStorage.getItem('auth_token')
    if (!raw) return {}
    return { Authorization: `Token ${raw}` }
  } catch {
    return {}
  }
}

export async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...getAuthHeader(),
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const { message, details } = await readErrorMessage(response)
    const err = Object.assign(new Error(message), { status: response.status, details })
    throw err
  }

  return (await response.json()) as T
}

export async function postJson<T = unknown>(url: string, body: unknown, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...(init?.headers ?? {}),
    },
    body: JSON.stringify(body ?? {}),
  })

  if (!response.ok) {
    const { message, details } = await readErrorMessage(response)
    const err = Object.assign(new Error(message), { status: response.status, details })
    throw err
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export async function patchJson<T = unknown>(url: string, body: unknown, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    method: 'PATCH',
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...(init?.headers ?? {}),
    },
    body: JSON.stringify(body ?? {}),
  })

  if (!response.ok) {
    const { message, details } = await readErrorMessage(response)
    const err = Object.assign(new Error(message), { status: response.status, details })
    throw err
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export async function deleteJson<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    method: 'DELETE',
    ...init,
    headers: {
      Accept: 'application/json',
      ...getAuthHeader(),
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const { message, details } = await readErrorMessage(response)
    const err = Object.assign(new Error(message), { status: response.status, details })
    throw err
  }

  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text().catch(() => '')
  if (!text) return undefined as T
  return JSON.parse(text) as T
}
