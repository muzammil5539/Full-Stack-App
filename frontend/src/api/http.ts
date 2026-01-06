export type ApiError = {
  message: string
  status?: number
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
    const text = await response.text().catch(() => '')
    throw {
      message: text || `Request failed (${response.status})`,
      status: response.status,
    } satisfies ApiError
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
    const text = await response.text().catch(() => '')
    throw {
      message: text || `Request failed (${response.status})`,
      status: response.status,
    } satisfies ApiError
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
