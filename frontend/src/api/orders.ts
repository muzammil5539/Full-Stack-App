import { getJson, postJson } from './http'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string

type PaginatedResponse<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type Order = {
  id: number
  order_number: string
  status: string
  total: string
  created_at: string
}

export async function listOrders(): Promise<Order[]> {
  const data = await getJson<PaginatedResponse<Order>>(`${API_BASE_URL}/api/v1/orders/`)
  return data.results
}

export async function createOrderFromCart(params: {
  shipping_address?: number
  billing_address?: number
  shipping_cost?: number
  tax?: number
  discount?: number
  notes?: string
}): Promise<unknown> {
  return postJson(`${API_BASE_URL}/api/v1/orders/create_from_cart/`, params)
}
