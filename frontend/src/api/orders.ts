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

export type OrderItem = {
  id: number
  product: number
  variant: number | null
  quantity: number
  price: string
  subtotal: string
  product_details?: {
    id: number
    name: string
    slug: string
    price: string
    images?: Array<{ id: number; image: string; is_primary: boolean; alt_text?: string | null }>
  }
}

export type OrderDetail = {
  id: number
  order_number: string
  user: number
  status: string
  items: OrderItem[]
  subtotal: string
  shipping_cost: string
  tax: string
  discount: string
  total: string
  shipping_address: number | null
  billing_address: number | null
  notes: string
  created_at: string
  updated_at: string
}

export async function listOrders(): Promise<Order[]> {
  const data = await getJson<PaginatedResponse<Order>>(`${API_BASE_URL}/api/v1/orders/`)
  return data.results
}

export async function getOrderById(id: number): Promise<OrderDetail> {
  return getJson<OrderDetail>(`${API_BASE_URL}/api/v1/orders/${id}/`)
}

export async function createOrderFromCart(params: {
  item_ids?: number[]
  shipping_address?: number
  billing_address?: number
  shipping_cost?: number
  tax?: number
  discount?: number
  notes?: string
}): Promise<OrderDetail> {
  return postJson<OrderDetail>(`${API_BASE_URL}/api/v1/orders/create_from_cart/`, params)
}
