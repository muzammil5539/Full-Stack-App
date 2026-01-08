import { getJson, postJson } from './http'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string

type PaginatedResponse<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type Payment = {
  id: number
  order: number
  payment_method: string
  transaction_id?: string
  status: string
  amount: string
  payment_date: string
  created_at?: string
  updated_at?: string
}

export async function listPayments(): Promise<Payment[]> {
  const data = await getJson<PaginatedResponse<Payment>>(`${API_BASE_URL}/api/v1/payments/`)
  return data.results
}

export async function listPaymentsForOrder(orderId: number): Promise<Payment[]> {
  const data = await getJson<PaginatedResponse<Payment>>(`${API_BASE_URL}/api/v1/payments/?order=${orderId}`)
  return data.results
}

export async function createPaymentForOrder(params: {
  order: number
  payment_method: string
}): Promise<Payment> {
  return postJson<Payment>(`${API_BASE_URL}/api/v1/payments/create_for_order/`, params)
}
