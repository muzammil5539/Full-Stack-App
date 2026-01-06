import { getJson, postJson } from './http'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string

type PaginatedResponse<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export async function adminList<T>(apiPath: string): Promise<PaginatedResponse<T>> {
  return getJson<PaginatedResponse<T>>(`${API_BASE_URL}${apiPath}`)
}

export async function adminGet<T>(apiPath: string, id: string | number): Promise<T> {
  return getJson<T>(`${API_BASE_URL}${apiPath}${id}/`)
}

export async function adminCreate<T>(apiPath: string, payload: unknown): Promise<T> {
  return postJson<T>(`${API_BASE_URL}${apiPath}`, payload)
}

export async function adminOptions<T>(apiPath: string, id?: string | number): Promise<T> {
  const url = id !== undefined && id !== null ? `${API_BASE_URL}${apiPath}${id}/` : `${API_BASE_URL}${apiPath}`
  return getJson<T>(url, { method: 'OPTIONS' })
}

export async function adminCreateMultipart<T>(apiPath: string, form: FormData): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${apiPath}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(localStorage.getItem('auth_token') ? { Authorization: `Token ${localStorage.getItem('auth_token')}` } : {}),
    },
    body: form,
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(text || `Request failed (${response.status})`)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export async function adminPatchMultipart<T>(apiPath: string, id: string | number, form: FormData): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${apiPath}${id}/`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      ...(localStorage.getItem('auth_token') ? { Authorization: `Token ${localStorage.getItem('auth_token')}` } : {}),
    },
    body: form,
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(text || `Request failed (${response.status})`)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export async function adminPatch<T>(apiPath: string, id: string | number, payload: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${apiPath}${id}/`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(localStorage.getItem('auth_token') ? { Authorization: `Token ${localStorage.getItem('auth_token')}` } : {}),
    },
    body: JSON.stringify(payload ?? {}),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(text || `Request failed (${response.status})`)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
