import { deleteJson, getJson, postJson } from './http'
import { clearCachePrefix } from './cache'

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
  const res = await postJson<T>(`${API_BASE_URL}${apiPath}`, payload)
  // Invalidate related frontend caches on writes
  try {
    if (apiPath.includes('/products/categories') || apiPath.includes('categories')) {
      clearCachePrefix(`${API_BASE_URL}/api/v1/products/categories/`)
    }
    if (apiPath.includes('/products/brands') || apiPath.includes('brands')) {
      clearCachePrefix(`${API_BASE_URL}/api/v1/products/brands/`)
    }
    // also clear product list cache to reflect new items
    clearCachePrefix(`${API_BASE_URL}/api/v1/products/`)
  } catch (err) {
    // best-effort: ignore cache invalidation failures
    void err
  }
  return res
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
  const data = (await response.json()) as T
  try {
    if (apiPath.includes('categories')) clearCachePrefix(`${API_BASE_URL}/api/v1/products/categories/`)
    if (apiPath.includes('brands')) clearCachePrefix(`${API_BASE_URL}/api/v1/products/brands/`)
    clearCachePrefix(`${API_BASE_URL}/api/v1/products/`)
  } catch (err) {
    // best-effort: ignore cache invalidation failures
    void err
  }
  return data
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
  const data = (await response.json()) as T
  try {
    if (apiPath.includes('categories')) clearCachePrefix(`${API_BASE_URL}/api/v1/products/categories/`)
    if (apiPath.includes('brands')) clearCachePrefix(`${API_BASE_URL}/api/v1/products/brands/`)
    clearCachePrefix(`${API_BASE_URL}/api/v1/products/`)
  } catch (err) {
    // best-effort: ignore cache invalidation failures
    void err
  }
  return data
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
  const data = (await response.json()) as T
  try {
    if (apiPath.includes('categories')) clearCachePrefix(`${API_BASE_URL}/api/v1/products/categories/`)
    if (apiPath.includes('brands')) clearCachePrefix(`${API_BASE_URL}/api/v1/products/brands/`)
    clearCachePrefix(`${API_BASE_URL}/api/v1/products/`)
  } catch (err) {
    // best-effort: ignore cache invalidation failures
    void err
  }
  return data
}

export async function adminDelete<T = unknown>(apiPath: string, id: string | number): Promise<T> {
  const res = await deleteJson<T>(`${API_BASE_URL}${apiPath}${id}/`)
  try {
    if (apiPath.includes('categories')) clearCachePrefix(`${API_BASE_URL}/api/v1/products/categories/`)
    if (apiPath.includes('brands')) clearCachePrefix(`${API_BASE_URL}/api/v1/products/brands/`)
    clearCachePrefix(`${API_BASE_URL}/api/v1/products/`)
  } catch (err) {
    // best-effort: ignore cache invalidation failures
    void err
  }
  return res
}
