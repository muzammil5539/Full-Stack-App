/**
 * Enhanced HTTP client with automatic auth token injection.
 * 
 * All requests automatically include the Authorization header if token exists.
 * Replace existing frontend/src/api/http.ts with this implementation.
 */

export type ApiError = {
  message: string
  status?: number
}

let _fetchThrottleCount = 0

async function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms))
}

/**
 * Get authorization header if user is authenticated.
 * 
 * Returns Authorization header with stored token from localStorage.
 */
function getAuthHeader(): HeadersInit {
  const token = localStorage.getItem('authToken')
  if (!token) {
    return {}
  }
  return {
    'Authorization': `Token ${token}`
  }
}

async function fetchWithRetry(
  input: RequestInfo,
  init?: RequestInit,
  maxAttempts = 3
): Promise<Response> {
  let attempt = 0
  _fetchThrottleCount = _fetchThrottleCount || 0

  while (true) {
    try {
      // Merge auth headers with provided headers
      const headers = {
        ...getAuthHeader(),
        ...init?.headers,
      }

      const response = await fetch(input, {
        ...init,
        headers,
      })

      // Retry on 429 (Too Many Requests) or 5xx server errors
      if (
        (response.status === 429 || (response.status >= 500 && response.status < 600)) &&
        attempt < maxAttempts - 1
      ) {
        const retryAfter = response.headers.get('retry-after')
        if (response.status === 429) {
          _fetchThrottleCount += 1
        }
        let wait = 500 * Math.pow(2, attempt)
        if (retryAfter) {
          const parsed = parseInt(retryAfter, 10)
          if (!Number.isNaN(parsed)) wait = parsed * 1000
        }
        attempt += 1
        await sleep(wait)
        continue
      }

      // Handle 401 Unauthorized (token expired or invalid)
      if (response.status === 401) {
        // Clear stored auth data
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')
        
        // Redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        
        throw new Error('Unauthorized: Please log in again')
      }

      return response
    } catch (e) {
      if (attempt < maxAttempts - 1) {
        attempt += 1
        await sleep(500 * Math.pow(2, attempt))
        continue
      }
      throw e
    }
  }
}

export function getThrottleMetrics() {
  return { throttleCount: _fetchThrottleCount }
}

export async function getJson<T>(url: string): Promise<T> {
  const response = await fetchWithRetry(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    try {
      const errorData = JSON.parse(errorText)
      throw {
        message: errorData.detail || errorData.error || 'Request failed',
        status: response.status,
      }
    } catch (e) {
      throw {
        message: errorText || `HTTP ${response.status}`,
        status: response.status,
      }
    }
  }

  return response.json()
}

export async function postJson<T>(url: string, data?: unknown): Promise<T> {
  const response = await fetchWithRetry(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  })

  if (!response.ok) {
    const errorText = await response.text()
    try {
      const errorData = JSON.parse(errorText)
      throw {
        message: errorData.detail || errorData.error || 'Request failed',
        status: response.status,
      }
    } catch (e) {
      throw {
        message: errorText || `HTTP ${response.status}`,
        status: response.status,
      }
    }
  }

  return response.json()
}

export async function patchJson<T>(url: string, data?: unknown): Promise<T> {
  const response = await fetchWithRetry(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  })

  if (!response.ok) {
    const errorText = await response.text()
    try {
      const errorData = JSON.parse(errorText)
      throw {
        message: errorData.detail || errorData.error || 'Request failed',
        status: response.status,
      }
    } catch (e) {
      throw {
        message: errorText || `HTTP ${response.status}`,
        status: response.status,
      }
    }
  }

  return response.json()
}

export async function putJson<T>(url: string, data?: unknown): Promise<T> {
  const response = await fetchWithRetry(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  })

  if (!response.ok) {
    const errorText = await response.text()
    try {
      const errorData = JSON.parse(errorText)
      throw {
        message: errorData.detail || errorData.error || 'Request failed',
        status: response.status,
      }
    } catch (e) {
      throw {
        message: errorText || `HTTP ${response.status}`,
        status: response.status,
      }
    }
  }

  return response.json()
}

export async function deleteJson<T>(url: string): Promise<T> {
  const response = await fetchWithRetry(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    try {
      const errorData = JSON.parse(errorText)
      throw {
        message: errorData.detail || errorData.error || 'Request failed',
        status: response.status,
      }
    } catch (e) {
      throw {
        message: errorText || `HTTP ${response.status}`,
        status: response.status,
      }
    }
  }

  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

/**
 * Helper to check if user is authenticated.
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('authToken')
}

/**
 * Helper to get current auth token.
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('authToken')
}

/**
 * Helper to clear auth and redirect to login.
 */
export function logout(): void {
  localStorage.removeItem('authToken')
  localStorage.removeItem('user')
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
}
