import { getJson, postJson } from './http'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string

type PaginatedResponse<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type Notification = {
  id: number
  user: number
  title: string
  message: string
  notification_type: string
  is_read: boolean
  created_at: string
}

export async function listNotifications(): Promise<Notification[]> {
  const data = await getJson<PaginatedResponse<Notification>>(`${API_BASE_URL}/api/v1/notifications/`)
  return data.results
}

export async function markAllNotificationsRead(): Promise<{ status: string }> {
  return postJson<{ status: string }>(`${API_BASE_URL}/api/v1/notifications/mark_all_as_read/`, {})
}
